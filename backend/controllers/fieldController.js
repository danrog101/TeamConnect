const { supabase } = require('../config/supabase');
const fs = require('fs').promises;
const path = require('path');

// Get all fields
exports.getFields = async (req, res) => {
  try {
    const { sport, city, country } = req.query;
    
    let query = supabase
      .from('fields')
      .select(`
        *,
        field_images (id, filename, filepath, is_primary),
        users!fields_added_by_fkey (username, avatar)
      `);
    
    if (sport) query = query.eq('sport', sport);
    if (city) query = query.eq('city', city);
    if (country) query = query.eq('country', country);

    const { data: fields, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Get fields error:', error);
      return res.status(500).json({ message: 'Server error' });
    }

    res.json(fields || []);
  } catch (error) {
    console.error('Get fields error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single field
exports.getField = async (req, res) => {
  try {
    const { fieldId } = req.params;

    const { data: field, error } = await supabase
      .from('fields')
      .select(`
        *,
        field_images (id, filename, filepath, is_primary),
        field_reviews (
          id,
          rating,
          comment,
          created_at,
          users (id, username, avatar)
        ),
        users!fields_added_by_fkey (id, username, avatar)
      `)
      .eq('id', fieldId)
      .single();

    if (error || !field) {
      console.error('Get field error:', error);
      return res.status(404).json({ message: 'Field not found' });
    }

    res.json(field);
  } catch (error) {
    console.error('Get field error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new field (with images)
exports.createField = async (req, res) => {
  try {
    const userId = req.user.id;
    const fieldData = JSON.parse(req.body.data); // Data is JSON string

    // Validation
    if (!fieldData.name || !fieldData.sport || !fieldData.city || !fieldData.address) {
      // Delete uploaded images if validation fails
      if (req.files) {
        for (const file of req.files) {
          try {
            await fs.unlink(file.path);
          } catch (err) {
            console.error('Failed to delete file:', err);
          }
        }
      }
      return res.status(400).json({ message: 'Fill all required fields!' });
    }

    // Insert field
    const { data: field, error } = await supabase
      .from('fields')
      .insert({
        name: fieldData.name,
        sport: fieldData.sport,
        city: fieldData.city,
        country: fieldData.country || 'Hrvatska',
        address: fieldData.address,
        formatted_address: fieldData.formatted_address,
        place_id: fieldData.place_id,
        price: fieldData.price,
        description: fieldData.description,
        coordinates_lat: fieldData.coordinates_lat,
        coordinates_lng: fieldData.coordinates_lng,
        availability: fieldData.availability || 'Dostupno',
        added_by: userId
      })
      .select()
      .single();

    if (error) {
      console.error('Create field error:', error);
      // Clean up uploaded files
      if (req.files) {
        for (const file of req.files) {
          try {
            await fs.unlink(file.path);
          } catch (err) {
            console.error('Failed to delete file:', err);
          }
        }
      }
      return res.status(500).json({ message: 'Failed to create field' });
    }

    // Add images if provided
    if (req.files && req.files.length > 0) {
      const imageInserts = req.files.map((file, index) => ({
        field_id: field.id,
        filename: file.filename,
        filepath: file.path,
        is_primary: index === 0
      }));

      const { error: imagesError } = await supabase
        .from('field_images')
        .insert(imageInserts);

      if (imagesError) {
        console.error('Insert images error:', imagesError);
        // Don't fail the request - field is created
      }
    }

    // Add facilities if provided
    if (fieldData.facilities && Array.isArray(fieldData.facilities)) {
      const facilityInserts = fieldData.facilities.map(facility => ({
        field_id: field.id,
        facility: facility
      }));

      const { error: facilitiesError } = await supabase
        .from('field_facilities')
        .insert(facilityInserts);

      if (facilitiesError) {
        console.error('Insert facilities error:', facilitiesError);
      }
    }

    // Get the complete field with relations
    const { data: completeField } = await supabase
      .from('fields')
      .select(`
        *,
        field_images (id, filename, filepath, is_primary),
        users!fields_added_by_fkey (username, avatar)
      `)
      .eq('id', field.id)
      .single();

    res.status(201).json({ 
      message: 'Field added successfully!', 
      field: completeField || field
    });
  } catch (error) {
    console.error('Create field error:', error);
    // Clean up uploaded files on error
    if (req.files) {
      for (const file of req.files) {
        try {
          await fs.unlink(file.path);
        } catch (err) {
          console.error('Failed to delete file:', err);
        }
      }
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Add review
exports.addReview = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5!' });
    }

    // Check if field exists
    const { data: field, error: fieldError } = await supabase
      .from('fields')
      .select('id')
      .eq('id', fieldId)
      .single();

    if (fieldError || !field) {
      return res.status(404).json({ message: 'Field not found' });
    }

    // Check if already reviewed
    const { data: existingReview } = await supabase
      .from('field_reviews')
      .select('id')
      .eq('field_id', fieldId)
      .eq('user_id', userId)
      .single();

    if (existingReview) {
      return res.status(400).json({ message: 'You already reviewed this field!' });
    }

    // Add review
    const { data: review, error } = await supabase
      .from('field_reviews')
      .insert({
        field_id: fieldId,
        user_id: userId,
        rating,
        comment: comment || null
      })
      .select(`
        *,
        users (id, username, avatar)
      `)
      .single();

    if (error) {
      console.error('Add review error:', error);
      return res.status(500).json({ message: 'Failed to add review' });
    }

    // The database trigger will automatically update the field's average rating

    res.json({ 
      message: 'Review added!', 
      review 
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete field
exports.deleteField = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const userId = req.user.id;

    // Get field with images
    const { data: field, error: fetchError } = await supabase
      .from('fields')
      .select(`
        *,
        field_images (filepath)
      `)
      .eq('id', fieldId)
      .single();

    if (fetchError || !field) {
      return res.status(404).json({ message: 'Field not found' });
    }

    // Check authorization
    if (field.added_by !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this field!' });
    }

    // Delete image files from filesystem
    if (field.field_images && field.field_images.length > 0) {
      for (const img of field.field_images) {
        try {
          await fs.unlink(img.filepath);
        } catch (err) {
          console.error('Failed to delete image file:', err);
          // Continue even if file deletion fails
        }
      }
    }

    // Delete field (CASCADE will delete related images, facilities, reviews)
    const { error: deleteError } = await supabase
      .from('fields')
      .delete()
      .eq('id', fieldId);

    if (deleteError) {
      console.error('Delete field error:', deleteError);
      return res.status(500).json({ message: 'Failed to delete field' });
    }

    res.json({ message: 'Field deleted successfully!' });
  } catch (error) {
    console.error('Delete field error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = exports;