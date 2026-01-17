const { supabase } = require('../config/supabase');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

// Upload video
exports.uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Video file not found!' });
    }

    const { title, description, category } = req.body;

    if (!title || !category) {
      // Delete uploaded file
      try {
        await fs.unlink(req.file.path);
      } catch (err) {
        console.error('Failed to delete file:', err);
      }
      return res.status(400).json({ message: 'Title and category are required!' });
    }

    const { data: video, error } = await supabase
      .from('videos')
      .insert({
        title,
        description: description || null,
        category,
        filename: req.file.filename,
        filepath: req.file.path,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        author_id: req.user.id,
        views: 0,
        trending: false
      })
      .select(`
        *,
        users!videos_author_id_fkey (id, username, avatar)
      `)
      .single();

    if (error) {
      console.error('Upload video error:', error);
      // Delete uploaded file on error
      try {
        await fs.unlink(req.file.path);
      } catch (err) {
        console.error('Failed to delete file:', err);
      }
      return res.status(500).json({ message: 'Failed to upload video' });
    }

    res.json({ 
      message: 'Video uploaded successfully!', 
      video 
    });
  } catch (error) {
    console.error('Upload video error:', error);
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (err) {
        console.error('Failed to delete file:', err);
      }
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all videos
exports.getVideos = async (req, res) => {
  try {
    const { category, search, author } = req.query;
    
    let query = supabase
      .from('videos')
      .select(`
        *,
        users!videos_author_id_fkey (id, username, avatar)
      `);
    
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (author) {
      query = query.eq('author_id', author);
    }

    const { data: videos, error } = await query
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Get videos error:', error);
      return res.status(500).json({ message: 'Server error' });
    }

    res.json(videos || []);
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single video
exports.getVideo = async (req, res) => {
  try {
    const { videoId } = req.params;

    const { data: video, error } = await supabase
      .from('videos')
      .select(`
        *,
        users!videos_author_id_fkey (id, username, avatar),
        video_comments (
          id,
          text,
          created_at,
          users (id, username, avatar)
        )
      `)
      .eq('id', videoId)
      .single();

    if (error || !video) {
      console.error('Get video error:', error);
      return res.status(404).json({ message: 'Video not found' });
    }

    // Get likes count
    const { data: likes } = await supabase
      .from('video_likes')
      .select('user_id')
      .eq('video_id', videoId);

    video.likesCount = likes?.length || 0;
    video.likes = likes || [];

    // Increment views
    await supabase
      .from('videos')
      .update({ views: video.views + 1 })
      .eq('id', videoId);

    res.json(video);
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Stream video
exports.streamVideo = async (req, res) => {
  try {
    const { videoId } = req.params;

    const { data: video, error } = await supabase
      .from('videos')
      .select('filepath, mime_type')
      .eq('id', videoId)
      .single();

    if (error || !video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const videoPath = video.filepath;
    
    if (!fsSync.existsSync(videoPath)) {
      return res.status(404).json({ message: 'Video file not found on server' });
    }

    const stat = fsSync.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fsSync.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': video.mime_type || 'video/mp4',
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': video.mime_type || 'video/mp4',
      };
      res.writeHead(200, head);
      fsSync.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    console.error('Stream video error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Like video
exports.likeVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user.id;

    // Check if video exists
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('id, author_id, title')
      .eq('id', videoId)
      .single();

    if (videoError || !video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('video_likes')
      .select('video_id')
      .eq('video_id', videoId)
      .eq('user_id', userId)
      .single();

    if (existingLike) {
      // Unlike
      const { error: deleteError } = await supabase
        .from('video_likes')
        .delete()
        .eq('video_id', videoId)
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Unlike error:', deleteError);
        return res.status(500).json({ message: 'Failed to unlike video' });
      }

      // Get updated likes count
      const { data: likes } = await supabase
        .from('video_likes')
        .select('user_id')
        .eq('video_id', videoId);

      return res.json({ 
        message: 'Video unliked', 
        liked: false,
        likesCount: likes?.length || 0
      });
    } else {
      // Like
      const { error: likeError } = await supabase
        .from('video_likes')
        .insert({
          video_id: videoId,
          user_id: userId
        });

      if (likeError) {
        console.error('Like error:', likeError);
        return res.status(500).json({ message: 'Failed to like video' });
      }

      // Get updated likes count
      const { data: likes } = await supabase
        .from('video_likes')
        .select('user_id')
        .eq('video_id', videoId);

      return res.json({ 
        message: 'Video liked', 
        liked: true,
        likesCount: likes?.length || 0
      });
    }
  } catch (error) {
    console.error('Like video error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add comment
exports.addComment = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Comment cannot be empty!' });
    }

    // Check if video exists
    const { data: video } = await supabase
      .from('videos')
      .select('id')
      .eq('id', videoId)
      .single();

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Add comment
    const { data: comment, error } = await supabase
      .from('video_comments')
      .insert({
        video_id: videoId,
        user_id: userId,
        text: text.trim()
      })
      .select(`
        *,
        users (id, username, avatar)
      `)
      .single();

    if (error) {
      console.error('Add comment error:', error);
      return res.status(500).json({ message: 'Failed to add comment' });
    }

    res.json({ 
      message: 'Comment added!',
      comment 
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete video
exports.deleteVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user.id;

    const { data: video, error: fetchError } = await supabase
      .from('videos')
      .select('author_id, filepath')
      .eq('id', videoId)
      .single();

    if (fetchError || !video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    if (video.author_id !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this video!' });
    }

    // Delete video file from filesystem
    if (video.filepath && fsSync.existsSync(video.filepath)) {
      try {
        await fs.unlink(video.filepath);
      } catch (err) {
        console.error('Failed to delete video file:', err);
        // Continue even if file deletion fails
      }
    }

    // Delete video from database (CASCADE will delete likes and comments)
    const { error: deleteError } = await supabase
      .from('videos')
      .delete()
      .eq('id', videoId);

    if (deleteError) {
      console.error('Delete video error:', deleteError);
      return res.status(500).json({ message: 'Failed to delete video' });
    }

    res.json({ message: 'Video deleted!' });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = exports;