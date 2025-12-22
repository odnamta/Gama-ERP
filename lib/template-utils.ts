// =====================================================
// v0.55: CUSTOMS - DOCUMENT TEMPLATES Utilities
// =====================================================

import { format } from 'date-fns';
import type {
  PlaceholderDefinition,
  PlaceholderValidationResult,
  TemplateFormData,
  TemplateValidationResult,
  DocumentType,
  GeneratedDocumentStatus,
} from '@/types/customs-templates';
import type { PIBDocument, PIBItem } from '@/types/pib';
import type { PEBDocument, PEBItem } from '@/types/peb';

/**
 * Extracts placeholder keys from HTML template
 * Finds all {{key}} patterns including array blocks {{#items}}...{{/items}}
 */
export function extractPlaceholders(html: string): string[] {
  const placeholders: Set<string> = new Set();
  
  // Match simple placeholders {{key}}
  const simplePattern = /\{\{([^#/}][^}]*)\}\}/g;
  let match;
  while ((match = simplePattern.exec(html)) !== null) {
    const key = match[1].trim();
    if (key) {
      placeholders.add(key);
    }
  }
  
  // Match array block markers {{#array}} and {{/array}}
  const arrayPattern = /\{\{#([^}]+)\}\}/g;
  while ((match = arrayPattern.exec(html)) !== null) {
    const key = match[1].trim();
    if (key) {
      placeholders.add(key);
    }
  }
  
  return Array.from(placeholders);
}

/**
 * Validates that all placeholders in HTML have definitions
 */
export function validatePlaceholders(
  html: string,
  definitions: PlaceholderDefinition[]
): PlaceholderValidationResult {
  const htmlPlaceholders = extractPlaceholders(html);
  const definedKeys = new Set(definitions.map(d => d.key));
  
  const missing: string[] = [];
  const unused: string[] = [];
  
  // Find placeholders in HTML that are not defined
  for (const placeholder of htmlPlaceholders) {
    if (!definedKeys.has(placeholder)) {
      missing.push(placeholder);
    }
  }
  
  // Find definitions that are not used in HTML
  const htmlPlaceholderSet = new Set(htmlPlaceholders);
  for (const def of definitions) {
    if (!htmlPlaceholderSet.has(def.key)) {
      unused.push(def.key);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing,
    unused,
  };
}

/**
 * Resolves placeholder values from source data
 */
export function resolvePlaceholders(
  definitions: PlaceholderDefinition[],
  pibData?: PIBDocument | null,
  pebData?: PEBDocument | null,
  pibItems?: PIBItem[],
  pebItems?: PEBItem[]
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};
  
  for (const def of definitions) {
    const { key, source, type } = def;
    
    if (source === 'current_date') {
      resolved[key] = format(new Date(), 'dd/MM/yyyy');
    } else if (source === 'manual') {
      resolved[key] = def.defaultValue || '';
    } else if (source === 'pib_items' && pibItems) {
      resolved[key] = pibItems.map((item, index) => ({
        item_no: index + 1,
        description: item.goods_description,
        hs_code: item.hs_code,
        qty: item.quantity,
        unit: item.unit,
        net_wt: item.net_weight_kg || 0,
        gross_wt: item.gross_weight_kg || 0,
        unit_price: item.unit_price || 0,
        amount: item.total_price || 0,
        dimensions: '',
      }));
    } else if (source === 'peb_items' && pebItems) {
      resolved[key] = pebItems.map((item, index) => ({
        item_no: index + 1,
        description: item.goods_description,
        hs_code: item.hs_code,
        qty: item.quantity,
        unit: item.unit,
        net_wt: item.net_weight_kg || 0,
        gross_wt: item.gross_weight_kg || 0,
        unit_price: item.unit_price || 0,
        amount: item.total_price || 0,
      }));
    } else if (source.startsWith('pib.') && pibData) {
      const field = source.replace('pib.', '') as keyof PIBDocument;
      resolved[key] = pibData[field] ?? '';
    } else if (source.startsWith('peb.') && pebData) {
      const field = source.replace('peb.', '') as keyof PEBDocument;
      resolved[key] = pebData[field] ?? '';
    } else {
      resolved[key] = type === 'array' ? [] : '';
    }
  }
  
  return resolved;
}

/**
 * Fills template HTML with resolved values
 * Supports simple {{key}} and array {{#items}}...{{/items}} syntax
 */
export function fillTemplate(
  html: string,
  data: Record<string, unknown>
): string {
  let result = html;
  
  // Process array blocks first {{#array}}...{{/array}}
  const arrayBlockPattern = /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
  result = result.replace(arrayBlockPattern, (_, arrayKey, template) => {
    const items = data[arrayKey];
    if (!Array.isArray(items) || items.length === 0) {
      return '';
    }
    
    return items.map(item => {
      let itemHtml = template;
      // Replace placeholders within the array item
      for (const [key, value] of Object.entries(item as Record<string, unknown>)) {
        const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        // Use function replacement to avoid special $ character issues
        itemHtml = itemHtml.replace(placeholder, () => formatValue(value));
      }
      return itemHtml;
    }).join('');
  });
  
  // Process simple placeholders {{key}}
  for (const [key, value] of Object.entries(data)) {
    if (!Array.isArray(value)) {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      // Use function replacement to avoid special $ character issues
      result = result.replace(placeholder, () => formatValue(value));
    }
  }
  
  // Replace any remaining unresolved placeholders with empty string
  result = result.replace(/\{\{[^}]+\}\}/g, '');
  
  return result;
}

/**
 * Formats a value for display in template
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'number') {
    return value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
  return String(value);
}

/**
 * Generates document number in format TYPE-YYYYMMDD-NNNN
 */
export function generateDocumentNumber(
  documentType: DocumentType,
  sequence: number
): string {
  const prefix = documentType.substring(0, 3).toUpperCase();
  const dateStr = format(new Date(), 'yyyyMMdd');
  const seqStr = String(sequence).padStart(4, '0');
  return `${prefix}-${dateStr}-${seqStr}`;
}

/**
 * Validates template HTML syntax (basic validation)
 */
export function validateTemplateHtml(html: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!html || html.trim().length === 0) {
    errors.push('Template HTML content is required');
    return { valid: false, errors };
  }
  
  // Check for unclosed array blocks
  const openBlocks = html.match(/\{\{#(\w+)\}\}/g) || [];
  const closeBlocks = html.match(/\{\{\/(\w+)\}\}/g) || [];
  
  const openKeys = openBlocks.map(b => b.match(/\{\{#(\w+)\}\}/)?.[1]);
  const closeKeys = closeBlocks.map(b => b.match(/\{\{\/(\w+)\}\}/)?.[1]);
  
  for (const key of openKeys) {
    if (key && !closeKeys.includes(key)) {
      errors.push(`Unclosed array block: {{#${key}}}`);
    }
  }
  
  for (const key of closeKeys) {
    if (key && !openKeys.includes(key)) {
      errors.push(`Unexpected closing block: {{/${key}}}`);
    }
  }
  
  // Check for basic HTML structure
  if (!html.includes('<') || !html.includes('>')) {
    errors.push('Template should contain valid HTML markup');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates template form data
 */
export function validateTemplateFormData(data: Partial<TemplateFormData>): TemplateValidationResult {
  const errors: { field: string; message: string }[] = [];
  
  if (!data.template_code || data.template_code.trim().length === 0) {
    errors.push({ field: 'template_code', message: 'Template code is required' });
  } else if (data.template_code.length > 30) {
    errors.push({ field: 'template_code', message: 'Template code must be 30 characters or less' });
  }
  
  if (!data.template_name || data.template_name.trim().length === 0) {
    errors.push({ field: 'template_name', message: 'Template name is required' });
  } else if (data.template_name.length > 200) {
    errors.push({ field: 'template_name', message: 'Template name must be 200 characters or less' });
  }
  
  if (!data.document_type) {
    errors.push({ field: 'document_type', message: 'Document type is required' });
  } else if (!isValidDocumentType(data.document_type)) {
    errors.push({ field: 'document_type', message: 'Invalid document type' });
  }
  
  if (!data.template_html || data.template_html.trim().length === 0) {
    errors.push({ field: 'template_html', message: 'Template HTML content is required' });
  } else {
    const htmlValidation = validateTemplateHtml(data.template_html);
    if (!htmlValidation.valid) {
      for (const error of htmlValidation.errors) {
        errors.push({ field: 'template_html', message: error });
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates placeholder definition
 */
export function validatePlaceholderDefinition(def: Partial<PlaceholderDefinition>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!def.key || def.key.trim().length === 0) {
    errors.push('Placeholder key is required');
  } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(def.key)) {
    errors.push('Placeholder key must be alphanumeric with underscores, starting with a letter');
  }
  
  if (!def.label || def.label.trim().length === 0) {
    errors.push('Placeholder label is required');
  }
  
  if (!def.source || def.source.trim().length === 0) {
    errors.push('Placeholder source is required');
  } else if (!isValidPlaceholderSource(def.source)) {
    errors.push('Invalid placeholder source');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Checks if a document type is valid
 */
export function isValidDocumentType(type: string): type is DocumentType {
  const validTypes: DocumentType[] = [
    'packing_list',
    'commercial_invoice',
    'coo',
    'insurance_cert',
    'bill_of_lading',
    'shipping_instruction',
    'cargo_manifest',
  ];
  return validTypes.includes(type as DocumentType);
}

/**
 * Checks if a document status is valid
 */
export function isValidDocumentStatus(status: string): status is GeneratedDocumentStatus {
  const validStatuses: GeneratedDocumentStatus[] = ['draft', 'final', 'sent', 'archived'];
  return validStatuses.includes(status as GeneratedDocumentStatus);
}

/**
 * Checks if a placeholder source is valid
 */
export function isValidPlaceholderSource(source: string): boolean {
  // Valid sources: manual, current_date, pib_items, peb_items, pib.*, peb.*
  if (['manual', 'current_date', 'pib_items', 'peb_items'].includes(source)) {
    return true;
  }
  if (source.startsWith('pib.') || source.startsWith('peb.')) {
    return true;
  }
  return false;
}

/**
 * Formats placeholder value based on type
 */
export function formatPlaceholderValue(
  value: unknown,
  type?: PlaceholderDefinition['type']
): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  switch (type) {
    case 'number':
      const num = typeof value === 'number' ? value : parseFloat(String(value));
      return isNaN(num) ? '' : num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    case 'date':
      if (value instanceof Date) {
        return format(value, 'dd/MM/yyyy');
      }
      if (typeof value === 'string') {
        const date = new Date(value);
        return isNaN(date.getTime()) ? value : format(date, 'dd/MM/yyyy');
      }
      return String(value);
    case 'array':
      return Array.isArray(value) ? JSON.stringify(value) : '';
    default:
      return String(value);
  }
}

/**
 * Gets the source type from a source string
 */
export function getSourceType(source: string): 'pib' | 'peb' | 'pib_items' | 'peb_items' | 'manual' | 'current_date' {
  if (source === 'manual') return 'manual';
  if (source === 'current_date') return 'current_date';
  if (source === 'pib_items') return 'pib_items';
  if (source === 'peb_items') return 'peb_items';
  if (source.startsWith('pib.')) return 'pib';
  if (source.startsWith('peb.')) return 'peb';
  return 'manual';
}

/**
 * Determines if a template requires PIB data based on placeholders
 */
export function requiresPibData(placeholders: PlaceholderDefinition[]): boolean {
  return placeholders.some(p => 
    p.source.startsWith('pib.') || p.source === 'pib_items'
  );
}

/**
 * Determines if a template requires PEB data based on placeholders
 */
export function requiresPebData(placeholders: PlaceholderDefinition[]): boolean {
  return placeholders.some(p => 
    p.source.startsWith('peb.') || p.source === 'peb_items'
  );
}
