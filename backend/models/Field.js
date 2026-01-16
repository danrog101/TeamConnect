const supabase = require('../config/supabase');

class FieldModel {
  // Create a new field
  static async create(fieldData) {
    const { data, error } = await supabase
      .from('fields')
      .insert([fieldData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Find field by ID
  static async findById(id) {
    const { data, error } = await supabase
      .from('fields')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Update field by ID
  static async updateById(id, updateData) {
    const { data, error } = await supabase
      .from('fields')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Delete field by ID
  static async deleteById(id) {
    const { error } = await supabase
      .from('fields')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  // Find fields with filters and pagination
  static async find(filters = {}, options = {}) {
    let query = supabase.from('fields').select('*');
    
    // Apply filters
    if (filters.sport) {
      query = query.eq('sport', filters.sport);
    }
    if (filters.city) {
      query = query.eq('city', filters.city);
    }
    if (filters.availability) {
      query = query.eq('availability', filters.availability);
    }
    if (filters.added_by) {
      query = query.eq('added_by', filters.added_by);
    }
    if (filters.min_rating) {
      query = query.gte('rating', filters.min_rating);
    }
    if (filters.max_price) {
      query = query.lte('price', filters.max_price);
    }
    if (filters.free_only) {
      query = query.eq('price', 0);
    }
    
    // Search
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,address.ilike.%${filters.search}%`);
    }
    
    // Location-based search (within radius)
    if (filters.lat && filters.lng && filters.radius_km) {
      // This would require PostGIS for proper geospatial queries
      // For now, we'll use a simple bounding box approach
      const latDelta = filters.radius_km / 111; // Approximate km per degree latitude
      const lngDelta = filters.radius_km / (111 * Math.cos(filters.lat * Math.PI / 180));
      
      query = query
        .gte('coordinates_lat', filters.lat - latDelta)
        .lte('coordinates_lat', filters.lat + latDelta)
        .gte('coordinates_lng', filters.lng - lngDelta)
        .lte('coordinates_lng', filters.lng + lngDelta);
    }
    
    // Sorting
    if (options.sort) {
      const [field, order] = options.sort.split(':');
      query = query.order(field, { ascending: order !== 'desc' });
    } else {
      query = query.order('rating', { ascending: false });
    }
    
    // Pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Get field with images
  static async findByIdWithImages(id) {
    const { data, error } = await supabase
      .from('fields')
      .select(`
        *,
        field_images (
          id,
          filename,
          filepath,
          is_primary
        )
      `)
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Get field with facilities
  static async findByIdWithFacilities(id) {
    const { data, error } = await supabase
      .from('fields')
      .select(`
        *,
        field_facilities (
          facility
        )
      `)
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    if (data) {
      data.facilities = data.field_facilities.map(f => f.facility);
    }
    
    return data;
  }

  // Get field with reviews
  static async findByIdWithReviews(id) {
    const { data, error } = await supabase
      .from('fields')
      .select(`
        *,
        field_reviews (
          id,
          user_id,
          rating,
          comment,
          created_at,
          users (
            id, username, avatar
          )
        )
      `)
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Get complete field information
  static async findByIdComplete(id) {
    const { data, error } = await supabase
      .from('fields')
      .select(`
        *,
        field_images (
          id,
          filename,
          filepath,
          is_primary
        ),
        field_facilities (
          facility
        ),
        field_reviews (
          id,
          user_id,
          rating,
          comment,
          created_at,
          users (
            id, username, avatar
          )
        )
      `)
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    if (data) {
      data.facilities = data.field_facilities.map(f => f.facility);
      // Sort images with primary first
      data.field_images.sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
      // Sort reviews by date
      data.field_reviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    
    return data;
  }

  // Add field image
  static async addImage(fieldId, imageData) {
    const { data, error } = await supabase
      .from('field_images')
      .insert([{
        field_id: fieldId,
        filename: imageData.filename,
        filepath: imageData.filepath,
        is_primary: imageData.isPrimary || false
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Remove field image
  static async removeImage(imageId) {
    const { error } = await supabase
      .from('field_images')
      .delete()
      .eq('id', imageId);
    
    if (error) throw error;
    return true;
  }

  // Set primary image
  static async setPrimaryImage(fieldId, imageId) {
    // First, unset all primary images for this field
    await supabase
      .from('field_images')
      .update({ is_primary: false })
      .eq('field_id', fieldId);
    
    // Then set the new primary image
    const { data, error } = await supabase
      .from('field_images')
      .update({ is_primary: true })
      .eq('id', imageId)
      .eq('field_id', fieldId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Add field facility
  static async addFacility(fieldId, facility) {
    const { error } = await supabase
      .from('field_facilities')
      .insert([{
        field_id: fieldId,
        facility
      }]);
    
    if (error) throw error;
    return true;
  }

  // Remove field facility
  static async removeFacility(fieldId, facility) {
    const { error } = await supabase
      .from('field_facilities')
      .delete()
      .eq('field_id', fieldId)
      .eq('facility', facility);
    
    if (error) throw error;
    return true;
  }

  // Add field review
  static async addReview(fieldId, userId, reviewData) {
    const { data, error } = await supabase
      .from('field_reviews')
      .insert([{
        field_id: fieldId,
        user_id: userId,
        rating: reviewData.rating,
        comment: reviewData.comment
      }])
      .select(`
        *,
        users (
          id, username, avatar
        )
      `)
      .single();
    
    if (error) throw error;
    return data;
  }

  // Update field review
  static async updateReview(reviewId, userId, reviewData) {
    const { data, error } = await supabase
      .from('field_reviews')
      .update({
        rating: reviewData.rating,
        comment: reviewData.comment
      })
      .eq('id', reviewId)
      .eq('user_id', userId)
      .select(`
        *,
        users (
          id, username, avatar
        )
      `)
      .single();
    
    if (error) throw error;
    return data;
  }

  // Remove field review
  static async removeReview(reviewId, userId) {
    const { error } = await supabase
      .from('field_reviews')
      .delete()
      .eq('id', reviewId)
      .eq('user_id', userId);
    
    if (error) throw error;
    return true;
  }

  // Get user's review for field
  static async getUserReview(fieldId, userId) {
    const { data, error } = await supabase
      .from('field_reviews')
      .select('*')
      .eq('field_id', fieldId)
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Get fields added by user
  static async getFieldsByUser(userId, options = {}) {
    let query = supabase
      .from('fields')
      .select('*')
      .eq('added_by', userId);
    
    // Apply filters
    if (options.sport) {
      query = query.eq('sport', options.sport);
    }
    if (options.availability) {
      query = query.eq('availability', options.availability);
    }
    
    // Sorting
    query = query.order('created_at', { ascending: false });
    
    // Pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Search fields
  static async searchFields(searchTerm, filters = {}) {
    let query = supabase
      .from('fields')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,formatted_address.ilike.%${searchTerm}%`);
    
    // Apply additional filters
    if (filters.sport) {
      query = query.eq('sport', filters.sport);
    }
    if (filters.city) {
      query = query.eq('city', filters.city);
    }
    if (filters.availability) {
      query = query.eq('availability', filters.availability);
    }
    
    query = query.order('rating', { ascending: false }).limit(20);
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Get fields near location
  static async getFieldsNearLocation(lat, lng, radiusKm = 10, filters = {}) {
    let query = supabase
      .from('fields')
      .select('*');
    
    // Calculate bounding box
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
    
    query = query
      .gte('coordinates_lat', lat - latDelta)
      .lte('coordinates_lat', lat + latDelta)
      .gte('coordinates_lng', lng - lngDelta)
      .lte('coordinates_lng', lng + lngDelta);
    
    // Apply additional filters
    if (filters.sport) {
      query = query.eq('sport', filters.sport);
    }
    if (filters.availability) {
      query = query.eq('availability', filters.availability);
    }
    if (filters.min_rating) {
      query = query.gte('rating', filters.min_rating);
    }
    
    query = query.order('rating', { ascending: false }).limit(50);
    
    const { data, error } = await query;
    if (error) throw error;
    
    // Calculate actual distances and filter
    return data.map(field => {
      const distance = calculateDistance(lat, lng, field.coordinates_lat, field.coordinates_lng);
      return {
        ...field,
        distance_km: Math.round(distance * 10) / 10
      };
    }).sort((a, b) => a.distance_km - b.distance_km);
  }

  // Get field statistics
  static async getFieldStats(fieldId) {
    const { data, error } = await supabase
      .from('field_reviews')
      .select('rating')
      .eq('field_id', fieldId);
    
    if (error) throw error;
    
    const stats = {
      totalReviews: data.length,
      averageRating: 0,
      ratingDistribution: {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0
      }
    };
    
    if (data.length > 0) {
      const totalRating = data.reduce((sum, review) => sum + review.rating, 0);
      stats.averageRating = Math.round((totalRating / data.length) * 10) / 10;
      
      data.forEach(review => {
        stats.ratingDistribution[review.rating]++;
      });
    }
    
    return stats;
  }

  // Update field availability
  static async updateAvailability(fieldId, availability) {
    const { data, error } = await supabase
      .from('fields')
      .update({ availability })
      .eq('id', fieldId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Get top rated fields
  static async getTopRatedFields(limit = 10, sport = null) {
    let query = supabase
      .from('fields')
      .select('*')
      .gte('rating', 4)
      .order('rating', { ascending: false })
      .limit(limit);
    
    if (sport) {
      query = query.eq('sport', sport);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Get available fields
  static async getAvailableFields(sport = null, city = null, limit = 20) {
    let query = supabase
      .from('fields')
      .select('*')
      .eq('availability', 'Dostupno')
      .order('rating', { ascending: false })
      .limit(limit);
    
    if (sport) {
      query = query.eq('sport', sport);
    }
    if (city) {
      query = query.eq('city', city);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
}

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

module.exports = FieldModel;
