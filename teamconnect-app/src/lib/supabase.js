import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper functions for Supabase operations
export const supabaseHelpers = {
  // Insert data into a table
  insert: async (table, data) => {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
    
    if (error) {
      console.error('Supabase insert error:', error)
      throw error
    }
    
    return result
  },

  // Update data in a table
  update: async (table, id, data) => {
    const { data: updatedData, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
    
    if (error) {
      console.error('Supabase update error:', error)
      throw error
    }
    
    return updatedData
  },

  // Get data from a table
  select: async (table, columns = '*', filters = {}) => {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .match(filters)
    
    if (error) {
      console.error('Supabase select error:', error)
      throw error
    }
    
    return data
  },

  // Delete data from a table
  delete: async (table, id) => {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Supabase delete error:', error)
      throw error
    }
    
    return true
  },

  // Get single record
  selectOne: async (table, id, columns = '*') => {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Supabase selectOne error:', error)
      throw error
    }
    
    return data
  }
}
