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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          details: string | null
          entity_id: string
          entity_type: string
          id: string
          timestamp: string
        }
        Insert: {
          action: string
          details?: string | null
          entity_id: string
          entity_type: string
          id: string
          timestamp?: string
        }
        Update: {
          action?: string
          details?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          timestamp?: string
        }
        Relationships: []
      }
      activity_reservations: {
        Row: {
          created_at: string
          date: string
          end_time: string
          group_id: string | null
          group_name: string
          id: string
          notes: string | null
          source: string | null
          space_id: string
          start_time: string
          status: string | null
        }
        Insert: {
          created_at?: string
          date: string
          end_time: string
          group_id?: string | null
          group_name: string
          id: string
          notes?: string | null
          source?: string | null
          space_id: string
          start_time: string
          status?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string
          group_id?: string | null
          group_name?: string
          id?: string
          notes?: string | null
          source?: string | null
          space_id?: string
          start_time?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_reservations_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "activity_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_spaces: {
        Row: {
          active: boolean | null
          capacity: number | null
          cleaning_notes: string | null
          cleaning_status: Database["public"]["Enums"]["cleaning_status"] | null
          created_at: string
          description: string | null
          display_name: string | null
          id: string
          maintenance_image: string | null
          maintenance_notes: string | null
          name: string
          notes: string | null
          number: number | null
          type: string | null
          updated_at: string
          working_status: Database["public"]["Enums"]["working_status"] | null
        }
        Insert: {
          active?: boolean | null
          capacity?: number | null
          cleaning_notes?: string | null
          cleaning_status?:
            | Database["public"]["Enums"]["cleaning_status"]
            | null
          created_at?: string
          description?: string | null
          display_name?: string | null
          id: string
          maintenance_image?: string | null
          maintenance_notes?: string | null
          name: string
          notes?: string | null
          number?: number | null
          type?: string | null
          updated_at?: string
          working_status?: Database["public"]["Enums"]["working_status"] | null
        }
        Update: {
          active?: boolean | null
          capacity?: number | null
          cleaning_notes?: string | null
          cleaning_status?:
            | Database["public"]["Enums"]["cleaning_status"]
            | null
          created_at?: string
          description?: string | null
          display_name?: string | null
          id?: string
          maintenance_image?: string | null
          maintenance_notes?: string | null
          name?: string
          notes?: string | null
          number?: number | null
          type?: string | null
          updated_at?: string
          working_status?: Database["public"]["Enums"]["working_status"] | null
        }
        Relationships: []
      }
      allocations: {
        Row: {
          allocation_type: Database["public"]["Enums"]["allocation_type"]
          beds_assigned: number
          created_at: string
          date_range_end: string
          date_range_start: string
          group_id: string
          id: string
          resource_id: string
          resource_label: string
        }
        Insert: {
          allocation_type: Database["public"]["Enums"]["allocation_type"]
          beds_assigned?: number
          created_at?: string
          date_range_end: string
          date_range_start: string
          group_id: string
          id: string
          resource_id: string
          resource_label: string
        }
        Update: {
          allocation_type?: Database["public"]["Enums"]["allocation_type"]
          beds_assigned?: number
          created_at?: string
          date_range_end?: string
          date_range_start?: string
          group_id?: string
          id?: string
          resource_id?: string
          resource_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "allocations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      beds: {
        Row: {
          bed_type: Database["public"]["Enums"]["bed_type"]
          bunk_number: number | null
          created_at: string
          guest_name: string | null
          id: string
          label: string
          status: Database["public"]["Enums"]["bed_status"]
          tent_id: string
          updated_at: string
        }
        Insert: {
          bed_type: Database["public"]["Enums"]["bed_type"]
          bunk_number?: number | null
          created_at?: string
          guest_name?: string | null
          id: string
          label: string
          status?: Database["public"]["Enums"]["bed_status"]
          tent_id: string
          updated_at?: string
        }
        Update: {
          bed_type?: Database["public"]["Enums"]["bed_type"]
          bunk_number?: number | null
          created_at?: string
          guest_name?: string | null
          id?: string
          label?: string
          status?: Database["public"]["Enums"]["bed_status"]
          tent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "beds_tent_id_fkey"
            columns: ["tent_id"]
            isOneToOne: false
            referencedRelation: "tents"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          date: string
          description: string | null
          entity_id: string | null
          entity_type: string | null
          facility_type: string | null
          id: string
          maintenance_image: string | null
          status: Database["public"]["Enums"]["task_status"]
          task_type: Database["public"]["Enums"]["task_type"]
          title: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          date: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          facility_type?: string | null
          id: string
          maintenance_image?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          task_type: Database["public"]["Enums"]["task_type"]
          title: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          date?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          facility_type?: string | null
          id?: string
          maintenance_image?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          task_type?: Database["public"]["Enums"]["task_type"]
          title?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string | null
          id: string
          receipt_number: string | null
          updated_at: string
          vendor: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          date: string
          description?: string | null
          id: string
          receipt_number?: string | null
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          receipt_number?: string | null
          updated_at?: string
          vendor?: string | null
        }
        Relationships: []
      }
      facilities: {
        Row: {
          area_id: string
          cleaning_status: Database["public"]["Enums"]["cleaning_status"]
          created_at: string
          facility_type: Database["public"]["Enums"]["facility_type"]
          gender: Database["public"]["Enums"]["facility_gender"]
          id: string
          is_accessible: boolean | null
          label: string
          maintenance_image: string | null
          maintenance_notes: string | null
          notes: string | null
          updated_at: string
          working_status: Database["public"]["Enums"]["working_status"]
        }
        Insert: {
          area_id: string
          cleaning_status?: Database["public"]["Enums"]["cleaning_status"]
          created_at?: string
          facility_type: Database["public"]["Enums"]["facility_type"]
          gender?: Database["public"]["Enums"]["facility_gender"]
          id: string
          is_accessible?: boolean | null
          label: string
          maintenance_image?: string | null
          maintenance_notes?: string | null
          notes?: string | null
          updated_at?: string
          working_status?: Database["public"]["Enums"]["working_status"]
        }
        Update: {
          area_id?: string
          cleaning_status?: Database["public"]["Enums"]["cleaning_status"]
          created_at?: string
          facility_type?: Database["public"]["Enums"]["facility_type"]
          gender?: Database["public"]["Enums"]["facility_gender"]
          id?: string
          is_accessible?: boolean | null
          label?: string
          maintenance_image?: string | null
          maintenance_notes?: string | null
          notes?: string | null
          updated_at?: string
          working_status?: Database["public"]["Enums"]["working_status"]
        }
        Relationships: [
          {
            foreignKeyName: "facilities_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "facility_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      facility_areas: {
        Row: {
          created_at: string
          description: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      facility_reservations: {
        Row: {
          created_at: string
          date: string
          end_time: string
          facility_id: string
          group_color: string | null
          group_name: string
          id: string
          notes: string | null
          number_of_people: number | null
          start_time: string
        }
        Insert: {
          created_at?: string
          date: string
          end_time: string
          facility_id: string
          group_color?: string | null
          group_name: string
          id: string
          notes?: string | null
          number_of_people?: number | null
          start_time: string
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string
          facility_id?: string
          group_color?: string | null
          group_name?: string
          id?: string
          notes?: string | null
          number_of_people?: number | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "facility_reservations_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          arrival_date: string
          arrival_time: string | null
          boys_count: number | null
          color: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          departure_date: string
          departure_time: string | null
          distribution_preference: Json | null
          girls_count: number | null
          group_type: string
          id: string
          meal_plan: Json | null
          name: string
          notes: string | null
          participant_count: number
          remaining_participants: number | null
          remaining_staff: number | null
          schedule_items: Json | null
          staff_count: number
          status: string | null
          total_pax: number
          updated_at: string
          vip_people_per_tent: number | null
          vip_tent_configs: Json | null
        }
        Insert: {
          arrival_date: string
          arrival_time?: string | null
          boys_count?: number | null
          color?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          departure_date: string
          departure_time?: string | null
          distribution_preference?: Json | null
          girls_count?: number | null
          group_type?: string
          id: string
          meal_plan?: Json | null
          name: string
          notes?: string | null
          participant_count?: number
          remaining_participants?: number | null
          remaining_staff?: number | null
          schedule_items?: Json | null
          staff_count?: number
          status?: string | null
          total_pax?: number
          updated_at?: string
          vip_people_per_tent?: number | null
          vip_tent_configs?: Json | null
        }
        Update: {
          arrival_date?: string
          arrival_time?: string | null
          boys_count?: number | null
          color?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          departure_date?: string
          departure_time?: string | null
          distribution_preference?: Json | null
          girls_count?: number | null
          group_type?: string
          id?: string
          meal_plan?: Json | null
          name?: string
          notes?: string | null
          participant_count?: number
          remaining_participants?: number | null
          remaining_staff?: number | null
          schedule_items?: Json | null
          staff_count?: number
          status?: string | null
          total_pax?: number
          updated_at?: string
          vip_people_per_tent?: number | null
          vip_tent_configs?: Json | null
        }
        Relationships: []
      }
      income: {
        Row: {
          amount: number
          created_at: string
          date: string
          description: string | null
          group_id: string | null
          group_name: string
          id: string
          invoice_number: string | null
          payment_method: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          date: string
          description?: string | null
          group_id?: string | null
          group_name: string
          id: string
          invoice_number?: string | null
          payment_method?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          description?: string | null
          group_id?: string | null
          group_name?: string
          id?: string
          invoice_number?: string | null
          payment_method?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "income_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      kitchen_time_slots: {
        Row: {
          created_at: string
          date: string
          group_id: string | null
          groups: Json | null
          id: string
          location: Database["public"]["Enums"]["meal_location"]
          meal_type: Database["public"]["Enums"]["meal_type"]
          source: string | null
          special_diets: Json | null
          time: string
          total_pax: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          group_id?: string | null
          groups?: Json | null
          id: string
          location?: Database["public"]["Enums"]["meal_location"]
          meal_type: Database["public"]["Enums"]["meal_type"]
          source?: string | null
          special_diets?: Json | null
          time: string
          total_pax?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          group_id?: string | null
          groups?: Json | null
          id?: string
          location?: Database["public"]["Enums"]["meal_location"]
          meal_type?: Database["public"]["Enums"]["meal_type"]
          source?: string | null
          special_diets?: Json | null
          time?: string
          total_pax?: number
          updated_at?: string
        }
        Relationships: []
      }
      neighborhood_reservations: {
        Row: {
          check_in_date: string
          check_out_date: string
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          gender_distribution: Json | null
          group_name: string
          id: string
          neighborhood_id: string
          notes: string | null
          reservation_type: Database["public"]["Enums"]["reservation_type"]
          tent_count: number | null
          tent_ids: Json | null
          total_beds: number | null
          total_people: number | null
        }
        Insert: {
          check_in_date: string
          check_out_date: string
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          gender_distribution?: Json | null
          group_name: string
          id: string
          neighborhood_id: string
          notes?: string | null
          reservation_type: Database["public"]["Enums"]["reservation_type"]
          tent_count?: number | null
          tent_ids?: Json | null
          total_beds?: number | null
          total_people?: number | null
        }
        Update: {
          check_in_date?: string
          check_out_date?: string
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          gender_distribution?: Json | null
          group_name?: string
          id?: string
          neighborhood_id?: string
          notes?: string | null
          reservation_type?: Database["public"]["Enums"]["reservation_type"]
          tent_count?: number | null
          tent_ids?: Json | null
          total_beds?: number | null
          total_people?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "neighborhood_reservations_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      neighborhoods: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          has_double_tents: boolean | null
          id: string
          is_white_tent: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          has_double_tents?: boolean | null
          id: string
          is_white_tent?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          has_double_tents?: boolean | null
          id?: string
          is_white_tent?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      outsourced: {
        Row: {
          created_at: string
          date: string
          hourly_rate: number
          hours: number
          id: string
          notes: string | null
          role: string
          updated_at: string
          worker_name: string
        }
        Insert: {
          created_at?: string
          date: string
          hourly_rate: number
          hours: number
          id: string
          notes?: string | null
          role: string
          updated_at?: string
          worker_name: string
        }
        Update: {
          created_at?: string
          date?: string
          hourly_rate?: number
          hours?: number
          id?: string
          notes?: string | null
          role?: string
          updated_at?: string
          worker_name?: string
        }
        Relationships: []
      }
      tents: {
        Row: {
          bathroom_maintenance_image: string | null
          bathroom_maintenance_notes: string | null
          bathroom_working_status:
            | Database["public"]["Enums"]["working_status"]
            | null
          check_in_date: string | null
          check_out_date: string | null
          cleaning_assigned_to: string | null
          cleaning_status: Database["public"]["Enums"]["cleaning_status"]
          code: string
          created_at: string
          double_tent_id: string | null
          gender: Database["public"]["Enums"]["tent_gender"] | null
          group_name: string | null
          has_private_bathroom: boolean | null
          has_private_shower: boolean | null
          id: string
          is_accessible: boolean | null
          is_alef: boolean | null
          is_vip: boolean | null
          neighborhood_id: string
          notes: string | null
          people_count: number | null
          shower_maintenance_image: string | null
          shower_maintenance_notes: string | null
          shower_working_status:
            | Database["public"]["Enums"]["working_status"]
            | null
          updated_at: string
        }
        Insert: {
          bathroom_maintenance_image?: string | null
          bathroom_maintenance_notes?: string | null
          bathroom_working_status?:
            | Database["public"]["Enums"]["working_status"]
            | null
          check_in_date?: string | null
          check_out_date?: string | null
          cleaning_assigned_to?: string | null
          cleaning_status?: Database["public"]["Enums"]["cleaning_status"]
          code: string
          created_at?: string
          double_tent_id?: string | null
          gender?: Database["public"]["Enums"]["tent_gender"] | null
          group_name?: string | null
          has_private_bathroom?: boolean | null
          has_private_shower?: boolean | null
          id: string
          is_accessible?: boolean | null
          is_alef?: boolean | null
          is_vip?: boolean | null
          neighborhood_id: string
          notes?: string | null
          people_count?: number | null
          shower_maintenance_image?: string | null
          shower_maintenance_notes?: string | null
          shower_working_status?:
            | Database["public"]["Enums"]["working_status"]
            | null
          updated_at?: string
        }
        Update: {
          bathroom_maintenance_image?: string | null
          bathroom_maintenance_notes?: string | null
          bathroom_working_status?:
            | Database["public"]["Enums"]["working_status"]
            | null
          check_in_date?: string | null
          check_out_date?: string | null
          cleaning_assigned_to?: string | null
          cleaning_status?: Database["public"]["Enums"]["cleaning_status"]
          code?: string
          created_at?: string
          double_tent_id?: string | null
          gender?: Database["public"]["Enums"]["tent_gender"] | null
          group_name?: string | null
          has_private_bathroom?: boolean | null
          has_private_shower?: boolean | null
          id?: string
          is_accessible?: boolean | null
          is_alef?: boolean | null
          is_vip?: boolean | null
          neighborhood_id?: string
          notes?: string | null
          people_count?: number | null
          shower_maintenance_image?: string | null
          shower_maintenance_notes?: string | null
          shower_working_status?:
            | Database["public"]["Enums"]["working_status"]
            | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tents_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      allocation_type: "VIP_TENT" | "NEIGHBORHOOD" | "TENT"
      bed_status: "FREE" | "RESERVED" | "OCCUPIED" | "BLOCKED"
      bed_type: "SINGLE" | "BUNK_TOP" | "BUNK_BOTTOM"
      cleaning_status: "CLEAN" | "NEEDS_CLEANING" | "CLEANING_IN_PROGRESS"
      facility_gender: "UNISEX" | "MALE" | "FEMALE"
      facility_type: "TOILET" | "SHOWER"
      meal_location: "DINING_HALL" | "OUTSIDE"
      meal_type: "BREAKFAST" | "LUNCH" | "DINNER"
      reservation_type: "FULL_NEIGHBORHOOD" | "SPECIFIC_TENTS"
      task_status: "PENDING" | "IN_PROGRESS" | "COMPLETED"
      task_type: "CLEANING" | "CHECKOUT" | "CHECKIN" | "MAINTENANCE" | "CUSTOM"
      tent_gender: "MIXED" | "MALE" | "FEMALE"
      working_status: "WORKING" | "BROKEN" | "MAINTENANCE" | "CLOSED"
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
    Enums: {
      allocation_type: ["VIP_TENT", "NEIGHBORHOOD", "TENT"],
      bed_status: ["FREE", "RESERVED", "OCCUPIED", "BLOCKED"],
      bed_type: ["SINGLE", "BUNK_TOP", "BUNK_BOTTOM"],
      cleaning_status: ["CLEAN", "NEEDS_CLEANING", "CLEANING_IN_PROGRESS"],
      facility_gender: ["UNISEX", "MALE", "FEMALE"],
      facility_type: ["TOILET", "SHOWER"],
      meal_location: ["DINING_HALL", "OUTSIDE"],
      meal_type: ["BREAKFAST", "LUNCH", "DINNER"],
      reservation_type: ["FULL_NEIGHBORHOOD", "SPECIFIC_TENTS"],
      task_status: ["PENDING", "IN_PROGRESS", "COMPLETED"],
      task_type: ["CLEANING", "CHECKOUT", "CHECKIN", "MAINTENANCE", "CUSTOM"],
      tent_gender: ["MIXED", "MALE", "FEMALE"],
      working_status: ["WORKING", "BROKEN", "MAINTENANCE", "CLOSED"],
    },
  },
} as const
