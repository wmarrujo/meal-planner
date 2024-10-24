export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      components: {
        Row: {
          amount: number
          dish: number
          meal: number
          restriction: Database["public"]["Enums"]["restriction"]
          unit: Database["public"]["Enums"]["unit"] | null
        }
        Insert: {
          amount?: number
          dish: number
          meal: number
          restriction?: Database["public"]["Enums"]["restriction"]
          unit?: Database["public"]["Enums"]["unit"] | null
        }
        Update: {
          amount?: number
          dish?: number
          meal?: number
          restriction?: Database["public"]["Enums"]["restriction"]
          unit?: Database["public"]["Enums"]["unit"] | null
        }
        Relationships: [
          {
            foreignKeyName: "components_dish_fkey"
            columns: ["dish"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "components_meal_fkey"
            columns: ["meal"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      dishes: {
        Row: {
          description: string
          id: number
          locked: boolean
          manager: string | null
          name: string
          public: boolean
        }
        Insert: {
          description?: string
          id?: number
          locked?: boolean
          manager?: string | null
          name: string
          public?: boolean
        }
        Update: {
          description?: string
          id?: number
          locked?: boolean
          manager?: string | null
          name?: string
          public?: boolean
        }
        Relationships: []
      }
      eaters: {
        Row: {
          eater: number
          meal: number
        }
        Insert: {
          eater: number
          meal: number
        }
        Update: {
          eater?: number
          meal?: number
        }
        Relationships: [
          {
            foreignKeyName: "eaters_eater_fkey"
            columns: ["eater"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eaters_meal_fkey"
            columns: ["meal"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      foods: {
        Row: {
          brand: string | null
          by_volume: boolean
          calcium: number | null
          calories: number | null
          carbohydrates: number | null
          category: string | null
          cholesterol: number | null
          company: string | null
          country: string | null
          description: string | null
          fat: number | null
          fiber: number | null
          id: number
          iron: number | null
          manager: string | null
          monounsaturated_fat: number | null
          name: string
          polyunsaturated_fat: number | null
          potassium: number | null
          protein: number | null
          public: boolean
          saturated_fat: number | null
          sodium: number | null
          sub_brand: string | null
          sugar: number | null
          trans_fat: number | null
          upc: string | null
          water: number | null
        }
        Insert: {
          brand?: string | null
          by_volume: boolean
          calcium?: number | null
          calories?: number | null
          carbohydrates?: number | null
          category?: string | null
          cholesterol?: number | null
          company?: string | null
          country?: string | null
          description?: string | null
          fat?: number | null
          fiber?: number | null
          id?: number
          iron?: number | null
          manager?: string | null
          monounsaturated_fat?: number | null
          name: string
          polyunsaturated_fat?: number | null
          potassium?: number | null
          protein?: number | null
          public?: boolean
          saturated_fat?: number | null
          sodium?: number | null
          sub_brand?: string | null
          sugar?: number | null
          trans_fat?: number | null
          upc?: string | null
          water?: number | null
        }
        Update: {
          brand?: string | null
          by_volume?: boolean
          calcium?: number | null
          calories?: number | null
          carbohydrates?: number | null
          category?: string | null
          cholesterol?: number | null
          company?: string | null
          country?: string | null
          description?: string | null
          fat?: number | null
          fiber?: number | null
          id?: number
          iron?: number | null
          manager?: string | null
          monounsaturated_fat?: number | null
          name?: string
          polyunsaturated_fat?: number | null
          potassium?: number | null
          protein?: number | null
          public?: boolean
          saturated_fat?: number | null
          sodium?: number | null
          sub_brand?: string | null
          sugar?: number | null
          trans_fat?: number | null
          upc?: string | null
          water?: number | null
        }
        Relationships: []
      }
      households: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      ingredients: {
        Row: {
          amount: number
          dish: number
          food: number
          serving: number
        }
        Insert: {
          amount: number
          dish: number
          food: number
          serving: number
        }
        Update: {
          amount?: number
          dish?: number
          food?: number
          serving?: number
        }
        Relationships: [
          {
            foreignKeyName: "ingredients_dish_fkey"
            columns: ["dish"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredients_food_fkey"
            columns: ["food"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredients_serving_fkey"
            columns: ["serving"]
            isOneToOne: false
            referencedRelation: "servings"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          amount: number
          day: string | null
          household: number
          id: number
          name: string
          percent: boolean
          restriction: Database["public"]["Enums"]["restriction"] | null
          time: string | null
        }
        Insert: {
          amount?: number
          day?: string | null
          household: number
          id?: number
          name: string
          percent?: boolean
          restriction?: Database["public"]["Enums"]["restriction"] | null
          time?: string | null
        }
        Update: {
          amount?: number
          day?: string | null
          household?: number
          id?: number
          name?: string
          percent?: boolean
          restriction?: Database["public"]["Enums"]["restriction"] | null
          time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meals_household_fkey"
            columns: ["household"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          head: boolean
          household: number
          person: number
        }
        Insert: {
          head?: boolean
          household: number
          person: number
        }
        Update: {
          head?: boolean
          household?: number
          person?: number
        }
        Relationships: [
          {
            foreignKeyName: "members_household_fkey"
            columns: ["household"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_person_fkey"
            columns: ["person"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          activity: number
          goal: number
          height: number
          id: number
          name: string
          sex: number
          user: string | null
          weight: number
        }
        Insert: {
          activity: number
          goal: number
          height: number
          id?: number
          name: string
          sex: number
          user?: string | null
          weight: number
        }
        Update: {
          activity?: number
          goal?: number
          height?: number
          id?: number
          name?: string
          sex?: number
          user?: string | null
          weight?: number
        }
        Relationships: []
      }
      servings: {
        Row: {
          amount: number
          amount_of_unit: number
          food: number
          id: number
          modifier: string | null
          unit: string | null
        }
        Insert: {
          amount: number
          amount_of_unit: number
          food: number
          id?: number
          modifier?: string | null
          unit?: string | null
        }
        Update: {
          amount?: number
          amount_of_unit?: number
          food?: number
          id?: number
          modifier?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "servings_food_fkey"
            columns: ["food"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cooperatives: {
        Args: Record<PropertyKey, never>
        Returns: number[]
      }
      my_households: {
        Args: Record<PropertyKey, never>
        Returns: number[]
      }
      my_households_headed: {
        Args: Record<PropertyKey, never>
        Returns: number[]
      }
      my_roommates: {
        Args: Record<PropertyKey, never>
        Returns: number[]
      }
    }
    Enums: {
      restriction: "exactly" | "no_more_than" | "no_less_than"
      unit: "kcal" | "g_or_ml" | "percent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
