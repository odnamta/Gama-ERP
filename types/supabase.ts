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
      export_types: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          permit_type: string | null
          requires_export_duty: boolean | null
          requires_permit: boolean | null
          type_code: string
          type_name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          permit_type?: string | null
          requires_export_duty?: boolean | null
          requires_permit?: boolean | null
          type_code: string
          type_name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          permit_type?: string | null
          requires_export_duty?: boolean | null
          requires_permit?: boolean | null
          type_code?: string
          type_name?: string
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
      peb_documents: {
        Row: {
          aju_number: string | null
          approved_at: string | null
          atd_date: string | null
          awb_number: string | null
          bill_of_lading: string | null
          consignee_address: string | null
          consignee_country: string | null
          consignee_name: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          customer_id: string | null
          customs_office_id: string | null
          documents: Json | null
          etd_date: string | null
          export_type_id: string | null
          exporter_address: string | null
          exporter_name: string
          exporter_npwp: string | null
          final_destination: string | null
          fob_value: number | null
          gross_weight_kg: number | null
          id: string
          internal_ref: string
          job_order_id: string | null
          loaded_at: string | null
          notes: string | null
          npe_date: string | null
          npe_number: string | null
          package_type: string | null
          peb_number: string | null
          port_of_discharge: string | null
          port_of_loading: string | null
          status: string | null
          submitted_at: string | null
          total_packages: number | null
          transport_mode: string | null
          updated_at: string | null
          vessel_name: string | null
          voyage_number: string | null
        }
        Insert: {
          aju_number?: string | null
          approved_at?: string | null
          atd_date?: string | null
          awb_number?: string | null
          bill_of_lading?: string | null
          consignee_address?: string | null
          consignee_country?: string | null
          consignee_name?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          customer_id?: string | null
          customs_office_id?: string | null
          documents?: Json | null
          etd_date?: string | null
          export_type_id?: string | null
          exporter_address?: string | null
          exporter_name: string
          exporter_npwp?: string | null
          final_destination?: string | null
          fob_value?: number | null
          gross_weight_kg?: number | null
          id?: string
          internal_ref: string
          job_order_id?: string | null
          loaded_at?: string | null
          notes?: string | null
          npe_date?: string | null
          npe_number?: string | null
          package_type?: string | null
          peb_number?: string | null
          port_of_discharge?: string | null
          port_of_loading?: string | null
          status?: string | null
          submitted_at?: string | null
          total_packages?: number | null
          transport_mode?: string | null
          updated_at?: string | null
          vessel_name?: string | null
          voyage_number?: string | null
        }
        Update: {
          aju_number?: string | null
          approved_at?: string | null
          atd_date?: string | null
          awb_number?: string | null
          bill_of_lading?: string | null
          consignee_address?: string | null
          consignee_country?: string | null
          consignee_name?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          customer_id?: string | null
          customs_office_id?: string | null
          documents?: Json | null
          etd_date?: string | null
          export_type_id?: string | null
          exporter_address?: string | null
          exporter_name?: string
          exporter_npwp?: string | null
          final_destination?: string | null
          fob_value?: number | null
          gross_weight_kg?: number | null
          id?: string
          internal_ref?: string
          job_order_id?: string | null
          loaded_at?: string | null
          notes?: string | null
          npe_date?: string | null
          npe_number?: string | null
          package_type?: string | null
          peb_number?: string | null
          port_of_discharge?: string | null
          port_of_loading?: string | null
          status?: string | null
          submitted_at?: string | null
          total_packages?: number | null
          transport_mode?: string | null
          updated_at?: string | null
          vessel_name?: string | null
          voyage_number?: string | null
        }
        Relationships: []
      }
      peb_items: {
        Row: {
          brand: string | null
          created_at: string | null
          currency: string | null
          goods_description: string
          gross_weight_kg: number | null
          hs_code: string
          hs_description: string | null
          id: string
          item_number: number
          net_weight_kg: number | null
          peb_id: string
          quantity: number
          specifications: string | null
          total_price: number | null
          unit: string
          unit_price: number | null
        }
        Insert: {
          brand?: string | null
          created_at?: string | null
          currency?: string | null
          goods_description: string
          gross_weight_kg?: number | null
          hs_code: string
          hs_description?: string | null
          id?: string
          item_number: number
          net_weight_kg?: number | null
          peb_id: string
          quantity: number
          specifications?: string | null
          total_price?: number | null
          unit: string
          unit_price?: number | null
        }
        Update: {
          brand?: string | null
          created_at?: string | null
          currency?: string | null
          goods_description?: string
          gross_weight_kg?: number | null
          hs_code?: string
          hs_description?: string | null
          id?: string
          item_number?: number
          net_weight_kg?: number | null
          peb_id?: string
          quantity?: number
          specifications?: string | null
          total_price?: number | null
          unit?: string
          unit_price?: number | null
        }
        Relationships: []
      }
      peb_status_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          id: string
          new_status: string
          notes: string | null
          peb_id: string
          previous_status: string | null
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_status: string
          notes?: string | null
          peb_id: string
          previous_status?: string | null
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_status?: string
          notes?: string | null
          peb_id?: string
          previous_status?: string | null
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
      projects: {
        Row: {
          created_at: string | null
          customer_id: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          status?: string
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
      [_ in never]: never
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

type PublicSchema = Database["public"]

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"]

export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"]

export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"]

export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T]

export type CompositeTypes<T extends keyof PublicSchema["CompositeTypes"]> = PublicSchema["CompositeTypes"][T]
