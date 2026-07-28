const { supabase } = require('../config/supabase');
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
          id, rating, comment, created_at,
          users (id, username, avatar)
        ),
        users!fields_added_by_fkey (id, username, avatar)
      `)
      .eq('id', fieldId)
      .single();

    if (error || !field) {
      return res.status(404).json({ message: 'Field not found' });
    }

    res.json(field);
  } catch (error) {
    console.error('Get field error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new field — slike idu na Supabase Storage
exports.createField = async (req, res) => {
  try {
    const userId = req.user.id;
    const fieldData = JSON.parse(req.body.data);

    if (!fieldData.name || !fieldData.sport || !fieldData.city || !fieldData.address) {
      return res.status(400).json({ message: 'Popunite sva obavezna polja!' });
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
      return res.status(500).json({ message: 'Failed to create field' });
    }

    // ✅ Upload slika na Supabase Storage
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const fileExt = path.extname(file.originalname).toLowerCase() || '.jpg';
        const fileName = `field-${field.id}-${Date.now()}-${i}${fileExt}`;
        const storagePath = `fields/${fileName}`;

        // Upload na Supabase Storage bucket "field-images"
        const { error: uploadError } = await supabase.storage
          .from('field-images')
          .upload(storagePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false
          });

        if (uploadError) {
          console.error('❌ Supabase storage upload error:', uploadError);
          continue;
        }

        // Dohvati public URL
        const { data: urlData } = supabase.storage
          .from('field-images')
          .getPublicUrl(storagePath);

        const publicUrl = urlData.publicUrl;

        // Spremi u field_images tablicu
        await supabase.from('field_images').insert({
          field_id: field.id,
          filename: fileName,
          filepath: publicUrl, // ✅ Supabase public URL
          is_primary: i === 0
        });
      }
    }

    // Add facilities
    if (fieldData.facilities && Array.isArray(fieldData.facilities) && fieldData.facilities.length > 0) {
      const facilityInserts = fieldData.facilities.map(facility => ({
        field_id: field.id,
        facility: facility
      }));

      await supabase.from('field_facilities').insert(facilityInserts);
    }

    // Dohvati kompletan field
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
      message: 'Teren uspješno dodan!',
      field: completeField || field
    });
  } catch (error) {
    console.error('Create field error:', error);
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
      return res.status(400).json({ message: 'Ocjena mora biti između 1 i 5!' });
    }

    const { data: field } = await supabase.from('fields').select('id').eq('id', fieldId).single();
    if (!field) return res.status(404).json({ message: 'Teren nije pronađen' });

    const { data: existingReview } = await supabase
      .from('field_reviews').select('id').eq('field_id', fieldId).eq('user_id', userId).single();

    if (existingReview) return res.status(400).json({ message: 'Već ste ocijenili ovaj teren!' });

    const { data: review, error } = await supabase
      .from('field_reviews')
      .insert({ field_id: fieldId, user_id: userId, rating, comment: comment || null })
      .select(`*, users (id, username, avatar)`)
      .single();

    if (error) return res.status(500).json({ message: 'Failed to add review' });

    res.json({ message: 'Recenzija dodana!', review });
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

    const { data: field } = await supabase
      .from('fields')
      .select(`*, field_images (filepath)`)
      .eq('id', fieldId)
      .single();

    if (!field) return res.status(404).json({ message: 'Teren nije pronađen' });
    if (field.added_by !== userId) return res.status(403).json({ message: 'Nemate ovlaštenje!' });

    // ✅ Briši slike iz Supabase Storage
    if (field.field_images && field.field_images.length > 0) {
      for (const img of field.field_images) {
        try {
          // Izvuci path iz public URL-a
          const url = img.filepath || '';
          const storagePathMatch = url.match(/field-images\/(.+)$/);
          if (storagePathMatch) {
            await supabase.storage.from('field-images').remove([storagePathMatch[1]]);
          }
        } catch (err) {
          console.error('Failed to delete image from storage:', err);
        }
      }
    }

    await supabase.from('fields').delete().eq('id', fieldId);

    res.json({ message: 'Teren uspješno obrisan!' });
  } catch (error) {
    console.error('Delete field error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = exports;