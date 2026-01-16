import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper functions for common Supabase operations
export const supabaseHelpers = {
  // Select data from a table
  select: async (table, options = {}) => {
    let query = supabase.from(table)
    
    if (options.columns) {
      query = query.select(options.columns)
    }
    
    if (options.filters) {
      Object.keys(options.filters).forEach(key => {
        const value = options.filters[key]
        if (typeof value === 'object' && value.in) {
          query = query.in(key, value.in)
        } else if (typeof value === 'object' && value.ilike) {
          query = query.ilike(key, `%${value.ilike}%`)
        } else {
          query = query.eq(key, value)
        }
      })
    }
    
    if (options.order) {
      const [column, ascending = true] = options.order
      query = query.order(column, { ascending })
    }
    
    if (options.limit) {
      query = query.limit(options.limit)
    }
    
    if (options.range) {
      query = query.range(options.range.from, options.range.to)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data
  },

  // Insert data into a table
  insert: async (table, data) => {
    const { data: result, error } = await supabase
      .from(table)
      .insert(Array.isArray(data) ? data : [data])
      .select()
    
    if (error) throw error
    return Array.isArray(data) ? result : result[0]
  },

  // Update data in a table
  update: async (table, data, filters) => {
    let query = supabase.from(table)
    
    // Apply filters
    Object.keys(filters).forEach(key => {
      query = query.eq(key, filters[key])
    })
    
    const { data: result, error } = await query
      .update(data)
      .select()
    
    if (error) throw error
    return result
  },

  // Delete data from a table
  delete: async (table, filters) => {
    let query = supabase.from(table)
    
    // Apply filters
    Object.keys(filters).forEach(key => {
      query = query.eq(key, filters[key])
    })
    
    const { error } = await query.delete()
    if (error) throw error
    return true
  },

  // Get single record
  single: async (table, filters) => {
    let query = supabase.from(table)
    
    // Apply filters
    Object.keys(filters).forEach(key => {
      query = query.eq(key, filters[key])
    })
    
    const { data, error } = await query.single()
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  // Upload file to Supabase Storage
  uploadFile: async (bucket, file, path) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file)
    
    if (error) throw error
    return data
  },

  // Get public URL for file
  getPublicUrl: (bucket, path) => {
    return supabase.storage
      .from(bucket)
      .getPublicUrl(path)
  },

  // Sign up with email and password
  signUp: async (email, password, options = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: options.data || {}
      }
    })
    
    if (error) throw error
    return data
  },

  // Sign in with email and password
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return true
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  // Update user
  updateUser: async (attributes) => {
    const { data, error } = await supabase.auth.updateUser(attributes)
    if (error) throw error
    return data
  },

  // Reset password
  resetPassword: async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
    return data
  }
}

export default supabase
