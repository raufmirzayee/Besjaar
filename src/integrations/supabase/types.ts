export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          body: string | null;
          created_at: string;
          entity_id: string | null;
          id: string;
          kind: string;
          module: string | null;
          read_by: string[];
          severity: string;
          title: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          entity_id?: string | null;
          id?: string;
          kind: string;
          module?: string | null;
          read_by?: string[];
          severity?: string;
          title: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          entity_id?: string | null;
          id?: string;
          kind?: string;
          module?: string | null;
          read_by?: string[];
          severity?: string;
          title?: string;
        };
        Relationships: [];
      };
      application_settings: {
        Row: {
          description: string | null;
          is_public: boolean;
          key: string;
          updated_at: string;
          value: Json;
        };
        Insert: {
          description?: string | null;
          is_public?: boolean;
          key: string;
          updated_at?: string;
          value?: Json;
        };
        Update: {
          description?: string | null;
          is_public?: boolean;
          key?: string;
          updated_at?: string;
          value?: Json;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          created_at: string;
          entity_id: string | null;
          entity_type: string | null;
          id: string;
          ip_address: string | null;
          module: string;
          new_value: Json | null;
          old_value: Json | null;
          user_email: string | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          ip_address?: string | null;
          module: string;
          new_value?: Json | null;
          old_value?: Json | null;
          user_email?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          ip_address?: string | null;
          module?: string;
          new_value?: Json | null;
          old_value?: Json | null;
          user_email?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      brands: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          logo_url: string | null;
          name: string;
          seo_description: string | null;
          seo_title: string | null;
          slug: string;
          sort_order: number;
          translations: Json;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          logo_url?: string | null;
          name: string;
          seo_description?: string | null;
          seo_title?: string | null;
          slug: string;
          sort_order?: number;
          translations?: Json;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          logo_url?: string | null;
          name?: string;
          seo_description?: string | null;
          seo_title?: string | null;
          slug?: string;
          sort_order?: number;
          translations?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          created_at: string;
          description: string | null;
          icon: string | null;
          id: string;
          image_url: string | null;
          is_archived: boolean;
          is_featured: boolean;
          is_visible: boolean;
          name: string;
          parent_id: string | null;
          seo_description: string | null;
          seo_title: string | null;
          slug: string;
          sort_order: number;
          translations: Json;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          image_url?: string | null;
          is_archived?: boolean;
          is_featured?: boolean;
          is_visible?: boolean;
          name: string;
          parent_id?: string | null;
          seo_description?: string | null;
          seo_title?: string | null;
          slug: string;
          sort_order?: number;
          translations?: Json;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          image_url?: string | null;
          is_archived?: boolean;
          is_featured?: boolean;
          is_visible?: boolean;
          name?: string;
          parent_id?: string | null;
          seo_description?: string | null;
          seo_title?: string | null;
          slug?: string;
          sort_order?: number;
          translations?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      channel_listings: {
        Row: {
          channel: string;
          channel_price: number | null;
          created_at: string;
          ean: string | null;
          external_offer_id: string | null;
          external_product_id: string | null;
          id: string;
          is_active: boolean;
          last_sync_error: string | null;
          last_sync_status: string | null;
          last_synced_at: string | null;
          price_sync_enabled: boolean;
          product_id: string | null;
          stock_sync_enabled: boolean;
          updated_at: string;
          variant_id: string | null;
        };
        Insert: {
          channel?: string;
          channel_price?: number | null;
          created_at?: string;
          ean?: string | null;
          external_offer_id?: string | null;
          external_product_id?: string | null;
          id?: string;
          is_active?: boolean;
          last_sync_error?: string | null;
          last_sync_status?: string | null;
          last_synced_at?: string | null;
          price_sync_enabled?: boolean;
          product_id?: string | null;
          stock_sync_enabled?: boolean;
          updated_at?: string;
          variant_id?: string | null;
        };
        Update: {
          channel?: string;
          channel_price?: number | null;
          created_at?: string;
          ean?: string | null;
          external_offer_id?: string | null;
          external_product_id?: string | null;
          id?: string;
          is_active?: boolean;
          last_sync_error?: string | null;
          last_sync_status?: string | null;
          last_synced_at?: string | null;
          price_sync_enabled?: boolean;
          product_id?: string | null;
          stock_sync_enabled?: boolean;
          updated_at?: string;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "channel_listings_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "channel_listings_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_messages: {
        Row: {
          created_at: string;
          email: string;
          handled_by: string | null;
          id: string;
          message: string;
          name: string;
          order_number: string | null;
          phone: string | null;
          staff_note: string | null;
          status: string;
          subject: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          email: string;
          handled_by?: string | null;
          id?: string;
          message: string;
          name: string;
          order_number?: string | null;
          phone?: string | null;
          staff_note?: string | null;
          status?: string;
          subject: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string;
          handled_by?: string | null;
          id?: string;
          message?: string;
          name?: string;
          order_number?: string | null;
          phone?: string | null;
          staff_note?: string | null;
          status?: string;
          subject?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      customer_addresses: {
        Row: {
          address_type: string;
          city: string;
          company_name: string | null;
          country: string;
          created_at: string;
          first_name: string;
          house_number: string;
          house_number_addition: string | null;
          id: string;
          is_default: boolean;
          label: string | null;
          last_name: string;
          phone: string | null;
          postal_code: string;
          street: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          address_type?: string;
          city: string;
          company_name?: string | null;
          country?: string;
          created_at?: string;
          first_name: string;
          house_number: string;
          house_number_addition?: string | null;
          id?: string;
          is_default?: boolean;
          label?: string | null;
          last_name: string;
          phone?: string | null;
          postal_code: string;
          street: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          address_type?: string;
          city?: string;
          company_name?: string | null;
          country?: string;
          created_at?: string;
          first_name?: string;
          house_number?: string;
          house_number_addition?: string | null;
          id?: string;
          is_default?: boolean;
          label?: string | null;
          last_name?: string;
          phone?: string | null;
          postal_code?: string;
          street?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      newsletter_subscribers: {
        Row: {
          confirmed: boolean;
          created_at: string;
          email: string;
          id: string;
          source: string;
          unsubscribed_at: string | null;
        };
        Insert: {
          confirmed?: boolean;
          created_at?: string;
          email: string;
          id?: string;
          source?: string;
          unsubscribed_at?: string | null;
        };
        Update: {
          confirmed?: boolean;
          created_at?: string;
          email?: string;
          id?: string;
          source?: string;
          unsubscribed_at?: string | null;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          created_at: string;
          id: string;
          image_url: string | null;
          line_total: number;
          order_id: string;
          product_id: string | null;
          product_name: string;
          product_slug: string | null;
          quantity: number;
          sku: string | null;
          unit_price: number;
          variant_id: string | null;
          vat_rate: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          image_url?: string | null;
          line_total?: number;
          order_id: string;
          product_id?: string | null;
          product_name: string;
          product_slug?: string | null;
          quantity?: number;
          sku?: string | null;
          unit_price?: number;
          variant_id?: string | null;
          vat_rate?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          image_url?: string | null;
          line_total?: number;
          order_id?: string;
          product_id?: string | null;
          product_name?: string;
          product_slug?: string | null;
          quantity?: number;
          sku?: string | null;
          unit_price?: number;
          variant_id?: string | null;
          vat_rate?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      order_status_history: {
        Row: {
          changed_by: string | null;
          created_at: string;
          id: string;
          note: string | null;
          order_id: string;
          status: Database["public"]["Enums"]["order_status"];
        };
        Insert: {
          changed_by?: string | null;
          created_at?: string;
          id?: string;
          note?: string | null;
          order_id: string;
          status: Database["public"]["Enums"]["order_status"];
        };
        Update: {
          changed_by?: string | null;
          created_at?: string;
          id?: string;
          note?: string | null;
          order_id?: string;
          status?: Database["public"]["Enums"]["order_status"];
        };
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      email_log: {
        Row: {
          created_at: string;
          error: string | null;
          id: string;
          order_id: string | null;
          provider: string | null;
          provider_message_id: string | null;
          recipient: string;
          status: string;
          subject: string;
          template: string;
        };
        Insert: {
          created_at?: string;
          error?: string | null;
          id?: string;
          order_id?: string | null;
          provider?: string | null;
          provider_message_id?: string | null;
          recipient: string;
          status?: string;
          subject: string;
          template: string;
        };
        Update: {
          created_at?: string;
          error?: string | null;
          id?: string;
          order_id?: string | null;
          provider?: string | null;
          provider_message_id?: string | null;
          recipient?: string;
          status?: string;
          subject?: string;
          template?: string;
        };
        Relationships: [
          {
            foreignKeyName: "email_log_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          carrier: string | null;
          cancelled_at: string | null;
          confirmation_sent_at: string | null;
          delivered_at: string | null;
          shipped_at: string | null;
          shipping_notified_at: string | null;
          terms_accepted_at: string | null;
          terms_version: string | null;
          tracking_code: string | null;
          tracking_url: string | null;
          billing_address: Json;
          company_name: string | null;
          created_at: string;
          currency: string;
          customer_note: string | null;
          discount_amount: number;
          email: string;
          external_order_id: string | null;
          first_name: string;
          id: string;
          idempotency_key: string | null;
          last_name: string;
          order_number: string;
          payment_method: string | null;
          payment_reference: string | null;
          payment_status: Database["public"]["Enums"]["payment_status"];
          phone: string | null;
          sales_channel: string;
          shipping_address: Json;
          shipping_cost: number;
          shipping_method_id: string | null;
          shipping_method_name: string | null;
          status: Database["public"]["Enums"]["order_status"];
          subtotal: number;
          total: number;
          updated_at: string;
          user_id: string | null;
          vat_amount: number;
        };
        Insert: {
          carrier?: string | null;
          cancelled_at?: string | null;
          confirmation_sent_at?: string | null;
          delivered_at?: string | null;
          shipped_at?: string | null;
          shipping_notified_at?: string | null;
          terms_accepted_at?: string | null;
          terms_version?: string | null;
          tracking_code?: string | null;
          tracking_url?: string | null;
          billing_address?: Json;
          company_name?: string | null;
          created_at?: string;
          currency?: string;
          customer_note?: string | null;
          discount_amount?: number;
          email: string;
          external_order_id?: string | null;
          first_name: string;
          id?: string;
          idempotency_key?: string | null;
          last_name: string;
          order_number?: string;
          payment_method?: string | null;
          payment_reference?: string | null;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          phone?: string | null;
          sales_channel?: string;
          shipping_address?: Json;
          shipping_cost?: number;
          shipping_method_id?: string | null;
          shipping_method_name?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          subtotal?: number;
          total?: number;
          updated_at?: string;
          user_id?: string | null;
          vat_amount?: number;
        };
        Update: {
          carrier?: string | null;
          cancelled_at?: string | null;
          confirmation_sent_at?: string | null;
          delivered_at?: string | null;
          shipped_at?: string | null;
          shipping_notified_at?: string | null;
          terms_accepted_at?: string | null;
          terms_version?: string | null;
          tracking_code?: string | null;
          tracking_url?: string | null;
          billing_address?: Json;
          company_name?: string | null;
          created_at?: string;
          currency?: string;
          customer_note?: string | null;
          discount_amount?: number;
          email?: string;
          external_order_id?: string | null;
          first_name?: string;
          id?: string;
          idempotency_key?: string | null;
          last_name?: string;
          order_number?: string;
          payment_method?: string | null;
          payment_reference?: string | null;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          phone?: string | null;
          sales_channel?: string;
          shipping_address?: Json;
          shipping_cost?: number;
          shipping_method_id?: string | null;
          shipping_method_name?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          subtotal?: number;
          total?: number;
          updated_at?: string;
          user_id?: string | null;
          vat_amount?: number;
        };
        Relationships: [
          {
            foreignKeyName: "orders_shipping_method_id_fkey";
            columns: ["shipping_method_id"];
            isOneToOne: false;
            referencedRelation: "shipping_methods";
            referencedColumns: ["id"];
          },
        ];
      };
      product_images: {
        Row: {
          alt_text: string | null;
          caption: string | null;
          created_at: string;
          id: string;
          image_url: string;
          is_main: boolean;
          product_id: string;
          sort_order: number;
          variant_id: string | null;
        };
        Insert: {
          alt_text?: string | null;
          caption?: string | null;
          created_at?: string;
          id?: string;
          image_url: string;
          is_main?: boolean;
          product_id: string;
          sort_order?: number;
          variant_id?: string | null;
        };
        Update: {
          alt_text?: string | null;
          caption?: string | null;
          created_at?: string;
          id?: string;
          image_url?: string;
          is_main?: boolean;
          product_id?: string;
          sort_order?: number;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_images_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      product_import_runs: {
        Row: {
          created_at: string;
          error_count: number;
          errors: Json;
          file_name: string;
          id: string;
          listings_updated: number;
          processed: number;
          products_updated: number;
          stock_mutations: number;
          total_lines: number;
          user_email: string | null;
          user_id: string | null;
          variants_updated: number;
        };
        Insert: {
          created_at?: string;
          error_count?: number;
          errors?: Json;
          file_name: string;
          id?: string;
          listings_updated?: number;
          processed?: number;
          products_updated?: number;
          stock_mutations?: number;
          total_lines?: number;
          user_email?: string | null;
          user_id?: string | null;
          variants_updated?: number;
        };
        Update: {
          created_at?: string;
          error_count?: number;
          errors?: Json;
          file_name?: string;
          id?: string;
          listings_updated?: number;
          processed?: number;
          products_updated?: number;
          stock_mutations?: number;
          total_lines?: number;
          user_email?: string | null;
          user_id?: string | null;
          variants_updated?: number;
        };
        Relationships: [];
      };
      product_reviews: {
        Row: {
          author_name: string;
          body: string;
          created_at: string;
          id: string;
          moderator_note: string | null;
          product_id: string;
          rating: number;
          status: Database["public"]["Enums"]["review_status"];
          title: string | null;
          updated_at: string;
          user_id: string | null;
          verified_purchase: boolean;
        };
        Insert: {
          author_name: string;
          body: string;
          created_at?: string;
          id?: string;
          moderator_note?: string | null;
          product_id: string;
          rating: number;
          status?: Database["public"]["Enums"]["review_status"];
          title?: string | null;
          updated_at?: string;
          user_id?: string | null;
          verified_purchase?: boolean;
        };
        Update: {
          author_name?: string;
          body?: string;
          created_at?: string;
          id?: string;
          moderator_note?: string | null;
          product_id?: string;
          rating?: number;
          status?: Database["public"]["Enums"]["review_status"];
          title?: string | null;
          updated_at?: string;
          user_id?: string | null;
          verified_purchase?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_variants: {
        Row: {
          bol_offer_id: string | null;
          created_at: string;
          dimensions: Json | null;
          ean: string | null;
          id: string;
          image_url: string | null;
          option_values: Json;
          product_id: string;
          purchase_cost: number | null;
          regular_price: number;
          safety_stock: number;
          sale_price: number | null;
          sku: string | null;
          sort_order: number;
          status: Database["public"]["Enums"]["product_status"];
          updated_at: string;
          variant_name: string;
          warehouse_stock: number;
          weight: number | null;
        };
        Insert: {
          bol_offer_id?: string | null;
          created_at?: string;
          dimensions?: Json | null;
          ean?: string | null;
          id?: string;
          image_url?: string | null;
          option_values?: Json;
          product_id: string;
          purchase_cost?: number | null;
          regular_price?: number;
          safety_stock?: number;
          sale_price?: number | null;
          sku?: string | null;
          sort_order?: number;
          status?: Database["public"]["Enums"]["product_status"];
          updated_at?: string;
          variant_name: string;
          warehouse_stock?: number;
          weight?: number | null;
        };
        Update: {
          bol_offer_id?: string | null;
          created_at?: string;
          dimensions?: Json | null;
          ean?: string | null;
          id?: string;
          image_url?: string | null;
          option_values?: Json;
          product_id?: string;
          purchase_cost?: number | null;
          regular_price?: number;
          safety_stock?: number;
          sale_price?: number | null;
          sku?: string | null;
          sort_order?: number;
          status?: Database["public"]["Enums"]["product_status"];
          updated_at?: string;
          variant_name?: string;
          warehouse_stock?: number;
          weight?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          attributes: Json;
          bestseller: boolean;
          bol_product_id: string | null;
          brand_id: string | null;
          category_id: string | null;
          created_at: string;
          ean: string | null;
          featured: boolean;
          full_description: string | null;
          height: number | null;
          id: string;
          internal_sku: string | null;
          length: number | null;
          low_stock_threshold: number;
          name: string;
          published_at: string | null;
          purchase_cost: number | null;
          rating_average: number;
          rating_count: number;
          regular_price: number;
          return_eligible: boolean;
          safety_stock: number;
          sale_price: number | null;
          sales_count: number;
          search_keywords: string | null;
          selling_points: Json;
          seo_description: string | null;
          seo_title: string | null;
          shipping_class: string | null;
          short_description: string | null;
          short_name: string | null;
          slug: string;
          specifications: Json;
          status: Database["public"]["Enums"]["product_status"];
          stock_quantity: number;
          subcategory_id: string | null;
          supplier_sku: string | null;
          translations: Json;
          updated_at: string;
          vat_rate: number;
          warranty_months: number;
          weight: number | null;
          width: number | null;
        };
        Insert: {
          attributes?: Json;
          bestseller?: boolean;
          bol_product_id?: string | null;
          brand_id?: string | null;
          category_id?: string | null;
          created_at?: string;
          ean?: string | null;
          featured?: boolean;
          full_description?: string | null;
          height?: number | null;
          id?: string;
          internal_sku?: string | null;
          length?: number | null;
          low_stock_threshold?: number;
          name: string;
          published_at?: string | null;
          purchase_cost?: number | null;
          rating_average?: number;
          rating_count?: number;
          regular_price?: number;
          return_eligible?: boolean;
          safety_stock?: number;
          sale_price?: number | null;
          sales_count?: number;
          search_keywords?: string | null;
          selling_points?: Json;
          seo_description?: string | null;
          seo_title?: string | null;
          shipping_class?: string | null;
          short_description?: string | null;
          short_name?: string | null;
          slug: string;
          specifications?: Json;
          status?: Database["public"]["Enums"]["product_status"];
          stock_quantity?: number;
          subcategory_id?: string | null;
          supplier_sku?: string | null;
          translations?: Json;
          updated_at?: string;
          vat_rate?: number;
          warranty_months?: number;
          weight?: number | null;
          width?: number | null;
        };
        Update: {
          attributes?: Json;
          bestseller?: boolean;
          bol_product_id?: string | null;
          brand_id?: string | null;
          category_id?: string | null;
          created_at?: string;
          ean?: string | null;
          featured?: boolean;
          full_description?: string | null;
          height?: number | null;
          id?: string;
          internal_sku?: string | null;
          length?: number | null;
          low_stock_threshold?: number;
          name?: string;
          published_at?: string | null;
          purchase_cost?: number | null;
          rating_average?: number;
          rating_count?: number;
          regular_price?: number;
          return_eligible?: boolean;
          safety_stock?: number;
          sale_price?: number | null;
          sales_count?: number;
          search_keywords?: string | null;
          selling_points?: Json;
          seo_description?: string | null;
          seo_title?: string | null;
          shipping_class?: string | null;
          short_description?: string | null;
          short_name?: string | null;
          slug?: string;
          specifications?: Json;
          status?: Database["public"]["Enums"]["product_status"];
          stock_quantity?: number;
          subcategory_id?: string | null;
          supplier_sku?: string | null;
          translations?: Json;
          updated_at?: string;
          vat_rate?: number;
          warranty_months?: number;
          weight?: number | null;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_subcategory_id_fkey";
            columns: ["subcategory_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          company_name: string | null;
          created_at: string;
          email: string | null;
          first_name: string | null;
          id: string;
          is_active: boolean;
          language: string;
          last_name: string | null;
          marketing_consent_at: string | null;
          newsletter_opt_in: boolean;
          phone: string | null;
          updated_at: string;
          vat_number: string | null;
        };
        Insert: {
          company_name?: string | null;
          created_at?: string;
          email?: string | null;
          first_name?: string | null;
          id: string;
          is_active?: boolean;
          language?: string;
          last_name?: string | null;
          marketing_consent_at?: string | null;
          newsletter_opt_in?: boolean;
          phone?: string | null;
          updated_at?: string;
          vat_number?: string | null;
        };
        Update: {
          company_name?: string | null;
          created_at?: string;
          email?: string | null;
          first_name?: string | null;
          id?: string;
          is_active?: boolean;
          language?: string;
          last_name?: string | null;
          marketing_consent_at?: string | null;
          newsletter_opt_in?: boolean;
          phone?: string | null;
          updated_at?: string;
          vat_number?: string | null;
        };
        Relationships: [];
      };
      return_items: {
        Row: {
          created_at: string;
          id: string;
          item_condition: string | null;
          item_reason: string | null;
          order_item_id: string;
          product_id: string | null;
          product_name: string;
          quantity: number;
          return_id: string;
          unit_price: number;
          variant_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          item_condition?: string | null;
          item_reason?: string | null;
          order_item_id: string;
          product_id?: string | null;
          product_name: string;
          quantity: number;
          return_id: string;
          unit_price?: number;
          variant_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          item_condition?: string | null;
          item_reason?: string | null;
          order_item_id?: string;
          product_id?: string | null;
          product_name?: string;
          quantity?: number;
          return_id?: string;
          unit_price?: number;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "return_items_order_item_id_fkey";
            columns: ["order_item_id"];
            isOneToOne: false;
            referencedRelation: "order_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "return_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "return_items_return_id_fkey";
            columns: ["return_id"];
            isOneToOne: false;
            referencedRelation: "returns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "return_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      returns: {
        Row: {
          created_at: string;
          customer_note: string | null;
          email: string;
          id: string;
          order_id: string;
          reason: string;
          received_at: string | null;
          refund_amount: number | null;
          refunded_at: string | null;
          requested_at: string;
          return_number: string;
          staff_note: string | null;
          status: Database["public"]["Enums"]["return_status"];
          tracking_code: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          customer_note?: string | null;
          email: string;
          id?: string;
          order_id: string;
          reason: string;
          received_at?: string | null;
          refund_amount?: number | null;
          refunded_at?: string | null;
          requested_at?: string;
          return_number: string;
          staff_note?: string | null;
          status?: Database["public"]["Enums"]["return_status"];
          tracking_code?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          customer_note?: string | null;
          email?: string;
          id?: string;
          order_id?: string;
          reason?: string;
          received_at?: string | null;
          refund_amount?: number | null;
          refunded_at?: string | null;
          requested_at?: string;
          return_number?: string;
          staff_note?: string | null;
          status?: Database["public"]["Enums"]["return_status"];
          tracking_code?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "returns_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      role_permissions: {
        Row: {
          action: string;
          created_at: string;
          id: string;
          module: string;
          role: Database["public"]["Enums"]["app_role"];
        };
        Insert: {
          action: string;
          created_at?: string;
          id?: string;
          module: string;
          role: Database["public"]["Enums"]["app_role"];
        };
        Update: {
          action?: string;
          created_at?: string;
          id?: string;
          module?: string;
          role?: Database["public"]["Enums"]["app_role"];
        };
        Relationships: [];
      };
      shipping_methods: {
        Row: {
          carrier: string;
          countries: string[];
          created_at: string;
          delivery_time: string | null;
          description: string | null;
          free_above: number | null;
          id: string;
          is_active: boolean;
          name: string;
          price: number;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          carrier?: string;
          countries?: string[];
          created_at?: string;
          delivery_time?: string | null;
          description?: string | null;
          free_above?: number | null;
          id?: string;
          is_active?: boolean;
          name: string;
          price?: number;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          carrier?: string;
          countries?: string[];
          created_at?: string;
          delivery_time?: string | null;
          description?: string | null;
          free_above?: number | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          price?: number;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      stock_movements: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          note: string | null;
          product_id: string | null;
          quantity_change: number;
          reason: string;
          reference_id: string | null;
          reference_type: string | null;
          variant_id: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          note?: string | null;
          product_id?: string | null;
          quantity_change: number;
          reason: string;
          reference_id?: string | null;
          reference_type?: string | null;
          variant_id?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          note?: string | null;
          product_id?: string | null;
          quantity_change?: number;
          reason?: string;
          reference_id?: string | null;
          reference_type?: string | null;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_movements_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      sync_jobs: {
        Row: {
          attempt: number;
          channel: string;
          created_at: string;
          error_message: string | null;
          failed_count: number;
          finished_at: string | null;
          id: string;
          job_type: string;
          processed_count: number;
          started_at: string | null;
          status: string;
          triggered_by: string | null;
          updated_at: string;
        };
        Insert: {
          attempt?: number;
          channel?: string;
          created_at?: string;
          error_message?: string | null;
          failed_count?: number;
          finished_at?: string | null;
          id?: string;
          job_type: string;
          processed_count?: number;
          started_at?: string | null;
          status?: string;
          triggered_by?: string | null;
          updated_at?: string;
        };
        Update: {
          attempt?: number;
          channel?: string;
          created_at?: string;
          error_message?: string | null;
          failed_count?: number;
          finished_at?: string | null;
          id?: string;
          job_type?: string;
          processed_count?: number;
          started_at?: string | null;
          status?: string;
          triggered_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      sync_logs: {
        Row: {
          channel: string;
          created_at: string;
          details: Json;
          id: string;
          job_id: string | null;
          level: string;
          message: string;
        };
        Insert: {
          channel?: string;
          created_at?: string;
          details?: Json;
          id?: string;
          job_id?: string | null;
          level?: string;
          message: string;
        };
        Update: {
          channel?: string;
          created_at?: string;
          details?: Json;
          id?: string;
          job_id?: string | null;
          level?: string;
          message?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sync_logs_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "sync_jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      wishlist_items: {
        Row: {
          created_at: string;
          id: string;
          product_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          product_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          product_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      app_role:
        | "super_admin"
        | "store_manager"
        | "warehouse"
        | "customer_service"
        | "content_editor"
        | "financial"
        | "customer";
      order_status:
        | "pending"
        | "paid"
        | "processing"
        | "packed"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded";
      payment_status: "open" | "paid" | "failed" | "expired" | "cancelled" | "refunded";
      product_status: "draft" | "active" | "out_of_stock" | "archived" | "discontinued";
      return_status: "requested" | "approved" | "rejected" | "received" | "refunded" | "cancelled";
      review_status: "pending" | "approved" | "rejected";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "store_manager",
        "warehouse",
        "customer_service",
        "content_editor",
        "financial",
        "customer",
      ],
      order_status: [
        "pending",
        "paid",
        "processing",
        "packed",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      payment_status: ["open", "paid", "failed", "expired", "cancelled", "refunded"],
      product_status: ["draft", "active", "out_of_stock", "archived", "discontinued"],
      return_status: ["requested", "approved", "rejected", "received", "refunded", "cancelled"],
      review_status: ["pending", "approved", "rejected"],
    },
  },
} as const;
