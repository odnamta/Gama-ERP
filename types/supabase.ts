export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action_type: string
          created_at: string | null
          details: Json | null
          document_id: string
          document_number: string
          document_type: string
          id: string
          user_id: string | null
          user_name: string
        }
        Insert: {
          action_type: string
          created_at?: string | null
          details?: Json | null
          document_id: string
          document_number: string
          document_type: string
          id?: string
          user_id?: string | null
          user_name: string
        }
        Update: {
          action_type?: string
          created_at?: string | null
          details?: Json | null
          document_id?: string
          document_number?: string
          document_type?: string
          id?: string
          user_id?: string | null
          user_name?: string
        }
        Relationships: []
      }
      asset_assignments: {
        Row: {
          asset_id: string
          assigned_by: string | null
          assigned_from: string
          assigned_to: string | null
          assignment_type: string
          created_at: string | null
          employee_id: string | null
          end_hours: number | null
          end_km: number | null
          hours_used: number | null
          id: string
          job_order_id: string | null
          km_used: number | null
          location_id: string | null
          notes: string | null
          project_id: string | null
          start_hours: number | null
          start_km: number | null
        }
        Insert: {
          asset_id: string
          assigned_by?: string | null
          assigned_from: string
          assigned_to?: string | null
          assignment_type: string
          created_at?: string | null
          employee_id?: string | null
          end_hours?: number | null
          end_km?: number | null
          hours_used?: number | null
          id?: string
          job_order_id?: string | null
          km_used?: number | null
          location_id?: string | null
          notes?: string | null
          project_id?: string | null
          start_hours?: number | null
          start_km?: number | null
        }
        Update: {
          asset_id?: string
          assigned_by?: string | null
          assigned_from?: string
          assigned_to?: string | null
          assignment_type?: string
          created_at?: string | null
          employee_id?: string | null
          end_hours?: number | null
          end_km?: number | null
          hours_used?: number | null
          id?: string
          job_order_id?: string | null
          km_used?: number | null
          location_id?: string | null
          notes?: string | null
          project_id?: string | null
          start_hours?: number | null
          start_km?: number | null
        }
        Relationships: []
      }
      customs_offices: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          office_code: string
          office_name: string
          office_type: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          office_code: string
          office_name: string
          office_type: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          office_code?: string
          office_name?: string
          office_type?: string
          phone?: string | null
        }
        Relationships: []
      }
      import_types: {
        Row: {
          created_at: string | null
          default_bm_rate: number | null
          default_pph_rate: number | null
          default_ppn_rate: number | null
          description: string | null
          id: string
          is_active: boolean | null
          permit_type: string | null
          requires_permit: boolean | null
          type_code: string
          type_name: string
        }
        Insert: {
          created_at?: string | null
          default_bm_rate?: number | null
          default_pph_rate?: number | null
          default_ppn_rate?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          permit_type?: string | null
          requires_permit?: boolean | null
          type_code: string
          type_name: string
        }
        Update: {
          created_at?: string | null
          default_bm_rate?: number | null
          default_pph_rate?: number | null
          default_ppn_rate?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          permit_type?: string | null
          requires_permit?: boolean | null
          type_code?: string
          type_name?: string
        }
        Relationships: []
      }
      pib_documents: {
        Row: {
          aju_number: string | null
          ata_date: string | null
          awb_number: string | null
          bea_masuk: number | null
          bill_of_lading: string | null
          cif_value: number | null
          cif_value_idr: number | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          customer_id: string | null
          customs_office_id: string | null
          documents: Json | null
          duties_paid_at: string | null
          eta_date: string | null
          exchange_rate: number | null
          fob_value: number | null
          freight_value: number | null
          gross_weight_kg: number | null
          id: string
          import_type_id: string | null
          importer_address: string | null
          importer_name: string
          importer_npwp: string | null
          insurance_value: number | null
          internal_ref: string
          job_order_id: string | null
          notes: string | null
          package_type: string | null
          pib_number: string | null
          port_of_discharge: string | null
          port_of_loading: string | null
          pph_import: number | null
          ppn: number | null
          released_at: string | null
          sppb_date: string | null
          sppb_number: string | null
          status: string | null
          submitted_at: string | null
          supplier_country: string | null
          supplier_name: string | null
          total_duties: number | null
          total_packages: number | null
          transport_mode: string | null
          updated_at: string | null
          vessel_name: string | null
          voyage_number: string | null
        }
        Insert: {
          aju_number?: string | null
          ata_date?: string | null
          awb_number?: string | null
          bea_masuk?: number | null
          bill_of_lading?: string | null
          cif_value?: number | null
          cif_value_idr?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          customer_id?: string | null
          customs_office_id?: string | null
          documents?: Json | null
          duties_paid_at?: string | null
          eta_date?: string | null
          exchange_rate?: number | null
          fob_value?: number | null
          freight_value?: number | null
          gross_weight_kg?: number | null
          id?: string
          import_type_id?: string | null
          importer_address?: string | null
          importer_name: string
          importer_npwp?: string | null
          insurance_value?: number | null
          internal_ref: string
          job_order_id?: string | null
          notes?: string | null
          package_type?: string | null
          pib_number?: string | null
          port_of_discharge?: string | null
          port_of_loading?: string | null
          pph_import?: number | null
          ppn?: number | null
          released_at?: string | null
          sppb_date?: string | null
          sppb_number?: string | null
          status?: string | null
          submitted_at?: string | null
          supplier_country?: string | null
          supplier_name?: string | null
          total_duties?: number | null
          total_packages?: number | null
          transport_mode?: string | null
          updated_at?: string | null
          vessel_name?: string | null
          voyage_number?: string | null
        }
        Update: {
          aju_number?: string | null
          ata_date?: string | null
          awb_number?: string | null
          bea_masuk?: number | null
          bill_of_lading?: string | null
          cif_value?: number | null
          cif_value_idr?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          customer_id?: string | null
          customs_office_id?: string | null
          documents?: Json | null
          duties_paid_at?: string | null
          eta_date?: string | null
          exchange_rate?: number | null
          fob_value?: number | null
          freight_value?: number | null
          gross_weight_kg?: number | null
          id?: string
          import_type_id?: string | null
          importer_address?: string | null
          importer_name?: string
          importer_npwp?: string | null
          insurance_value?: number | null
          internal_ref?: string
          job_order_id?: string | null
          notes?: string | null
          package_type?: string | null
          pib_number?: string | null
          port_of_discharge?: string | null
          port_of_loading?: string | null
          pph_import?: number | null
          ppn?: number | null
          released_at?: string | null
          sppb_date?: string | null
          sppb_number?: string | null
          status?: string | null
          submitted_at?: string | null
          supplier_country?: string | null
          supplier_name?: string | null
          total_duties?: number | null
          total_packages?: number | null
          transport_mode?: string | null
          updated_at?: string | null
          vessel_name?: string | null
          voyage_number?: string | null
        }
        Relationships: []
      }
      pib_items: {
        Row: {
          bea_masuk: number | null
          bm_rate: number | null
          brand: string | null
          country_of_origin: string | null
          created_at: string | null
          currency: string | null
          goods_description: string
          gross_weight_kg: number | null
          hs_code: string
          hs_description: string | null
          id: string
          item_number: number
          net_weight_kg: number | null
          permit_date: string | null
          permit_number: string | null
          permit_type: string | null
          pib_id: string
          pph_import: number | null
          pph_rate: number | null
          ppn: number | null
          ppn_rate: number | null
          quantity: number
          requires_permit: boolean | null
          specifications: string | null
          total_price: number | null
          type_model: string | null
          unit: string
          unit_price: number | null
        }
        Insert: {
          bea_masuk?: number | null
          bm_rate?: number | null
          brand?: string | null
          country_of_origin?: string | null
          created_at?: string | null
          currency?: string | null
          goods_description: string
          gross_weight_kg?: number | null
          hs_code: string
          hs_description?: string | null
          id?: string
          item_number: number
          net_weight_kg?: number | null
          permit_date?: string | null
          permit_number?: string | null
          permit_type?: string | null
          pib_id: string
          pph_import?: number | null
          pph_rate?: number | null
          ppn?: number | null
          ppn_rate?: number | null
          quantity: number
          requires_permit?: boolean | null
          specifications?: string | null
          total_price?: number | null
          type_model?: string | null
          unit: string
          unit_price?: number | null
        }
        Update: {
          bea_masuk?: number | null
          bm_rate?: number | null
          brand?: string | null
          country_of_origin?: string | null
          created_at?: string | null
          currency?: string | null
          goods_description?: string
          gross_weight_kg?: number | null
          hs_code?: string
          hs_description?: string | null
          id?: string
          item_number?: number
          net_weight_kg?: number | null
          permit_date?: string | null
          permit_number?: string | null
          permit_type?: string | null
          pib_id?: string
          pph_import?: number | null
          pph_rate?: number | null
          ppn?: number | null
          ppn_rate?: number | null
          quantity?: number
          requires_permit?: boolean | null
          specifications?: string | null
          total_price?: number | null
          type_model?: string | null
          unit?: string
          unit_price?: number | null
        }
        Relationships: []
      }
      pib_status_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          id: string
          new_status: string
          notes: string | null
          pib_id: string
          previous_status: string | null
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_status: string
          notes?: string | null
          pib_id: string
          previous_status?: string | null
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_status?: string
          notes?: string | null
          pib_id?: string
          previous_status?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      job_orders: {
        Row: {
          amount: number
          completed_at: string | null
          converted_from_pjo_at: string | null
          created_at: string | null
          customer_id: string
          description: string
          equipment_cost: number | null
          final_cost: number | null
          final_revenue: number | null
          has_berita_acara: boolean | null
          has_surat_jalan: boolean | null
          id: string
          invoice_terms: Json | null
          invoiceable_amount: number | null
          jo_number: string
          net_margin: number | null
          net_profit: number | null
          pjo_id: string | null
          project_id: string | null
          requires_berita_acara: boolean | null
          status: string
          submitted_by: string | null
          submitted_to_finance_at: string | null
          total_invoiced: number | null
          total_overhead: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number
          completed_at?: string | null
          converted_from_pjo_at?: string | null
          created_at?: string | null
          customer_id: string
          description: string
          equipment_cost?: number | null
          final_cost?: number | null
          final_revenue?: number | null
          has_berita_acara?: boolean | null
          has_surat_jalan?: boolean | null
          id?: string
          invoice_terms?: Json | null
          invoiceable_amount?: number | null
          jo_number: string
          net_margin?: number | null
          net_profit?: number | null
          pjo_id?: string | null
          project_id?: string | null
          requires_berita_acara?: boolean | null
          status?: string
          submitted_by?: string | null
          submitted_to_finance_at?: string | null
          total_invoiced?: number | null
          total_overhead?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          completed_at?: string | null
          converted_from_pjo_at?: string | null
          created_at?: string | null
          customer_id?: string
          description?: string
          equipment_cost?: number | null
          final_cost?: number | null
          final_revenue?: number | null
          has_berita_acara?: boolean | null
          has_surat_jalan?: boolean | null
          id?: string
          invoice_terms?: Json | null
          invoiceable_amount?: number | null
          jo_number?: string
          net_margin?: number | null
          net_profit?: number | null
          pjo_id?: string | null
          project_id?: string | null
          requires_berita_acara?: boolean | null
          status?: string
          submitted_by?: string | null
          submitted_to_finance_at?: string | null
          total_invoiced?: number | null
          total_overhead?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          can_approve_pjo: boolean
          can_create_pjo: boolean
          can_fill_costs: boolean
          can_manage_invoices: boolean
          can_manage_users: boolean
          can_see_profit: boolean
          can_see_revenue: boolean
          created_at: string | null
          custom_dashboard: string | null
          custom_homepage: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          last_login_at: string | null
          preferences: Json | null
          role: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          can_approve_pjo?: boolean
          can_create_pjo?: boolean
          can_fill_costs?: boolean
          can_manage_invoices?: boolean
          can_manage_users?: boolean
          can_see_profit?: boolean
          can_see_revenue?: boolean
          created_at?: string | null
          custom_dashboard?: string | null
          custom_homepage?: string | null
          email: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          preferences?: Json | null
          role?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          can_approve_pjo?: boolean
          can_create_pjo?: boolean
          can_fill_costs?: boolean
          can_manage_invoices?: boolean
          can_manage_users?: boolean
          can_see_profit?: boolean
          can_see_revenue?: boolean
          created_at?: string | null
          custom_dashboard?: string | null
          custom_homepage?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          preferences?: Json | null
          role?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      active_pib_documents: {
        Row: {
          aju_number: string | null
          ata_date: string | null
          awb_number: string | null
          bea_masuk: number | null
          bill_of_lading: string | null
          cif_value: number | null
          cif_value_idr: number | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          customer_id: string | null
          customer_name: string | null
          customs_office_code: string | null
          customs_office_id: string | null
          customs_office_name: string | null
          documents: Json | null
          duties_paid_at: string | null
          eta_date: string | null
          exchange_rate: number | null
          fob_value: number | null
          freight_value: number | null
          gross_weight_kg: number | null
          id: string | null
          import_type_code: string | null
          import_type_id: string | null
          import_type_name: string | null
          importer_address: string | null
          importer_name: string | null
          importer_npwp: string | null
          insurance_value: number | null
          internal_ref: string | null
          item_count: number | null
          jo_number: string | null
          job_order_id: string | null
          notes: string | null
          package_type: string | null
          pib_number: string | null
          port_of_discharge: string | null
          port_of_loading: string | null
          pph_import: number | null
          ppn: number | null
          released_at: string | null
          sppb_date: string | null
          sppb_number: string | null
          status: string | null
          submitted_at: string | null
          supplier_country: string | null
          supplier_name: string | null
          total_duties: number | null
          total_packages: number | null
          transport_mode: string | null
          updated_at: string | null
          vessel_name: string | null
          voyage_number: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
