const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3002; // Use environment variable or default to 3002

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies
app.use(express.static('public')); // Serve static files from the 'public' directory

const pool = require('./db'); // Import the database connection pool

// Test Route
app.get('/', (req, res) => {
  res.send('Project 2 Backend is running!');
});

// TODO: API routes will be added here

// API Endpoints

// A. Retrieve all products
app.get('/api/products', async (req, res) => {
  try {
    const query = `
      SELECT 
        p.product_id, 
        p.prod_name, 
        p.price, 
        p.description, 
        p.image_id, -- From Products table, for older data
        p.direct_image_url, -- Newly added column for direct URLs
        CASE 
          WHEN p.direct_image_url IS NOT NULL AND p.direct_image_url != '' THEN p.direct_image_url
          WHEN im.image_url IS NOT NULL AND im.image_url != '' THEN CONCAT('/images/', im.image_url, '.jpg') 
          ELSE '/images/no_image.jpg' -- Default image
        END as image_url -- Final image URL to be used by the frontend
      FROM 
        Products p
      LEFT JOIN 
        ImageMaster im ON p.image_id = im.image_id
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to retrieve products', details: error.message });
  }
});

// B. Add a new product
app.post('/api/products', async (req, res) => {
  // Expect name, price, description, and imageId (instead of imageUrl)
  const { name, price, description, imageId } = req.body;

  // Basic validation
  if (!name || price === undefined || !description) { // imageId is optional
    return res.status(400).json({ error: 'Missing required fields: name, price, and description are required.' });
  }
  if (typeof price !== 'number' || price < 0) {
    return res.status(400).json({ error: 'Price must be a non-negative number.' });
  }
  // Validate imageId if provided: should be a number (or null/undefined)
  if (imageId !== undefined && imageId !== null && typeof imageId !== 'number') {
    return res.status(400).json({ error: 'Image ID must be a number.' });
  }

  try {
    const query = `
      INSERT INTO Products (prod_name, price, description, image_id, direct_image_url) 
      VALUES (?, ?, ?, ?, NULL) /* direct_image_url is NULL as we now use image_id from ImageMaster */
    `;
    // Store the provided imageId (or null if it wasn't provided) into image_id
    const [result] = await pool.query(query, [name, price, description, imageId || null]);
    
    const newProductId = result.insertId;
    
    // Fetch the newly created product to return it, using the updated GET logic
    const getNewProductQuery = `
      SELECT 
        p.product_id, 
        p.prod_name, 
        p.price, 
        p.description, 
        p.image_id, 
        p.direct_image_url, 
        CASE 
          WHEN p.direct_image_url IS NOT NULL AND p.direct_image_url != '' THEN p.direct_image_url
          WHEN im.image_url IS NOT NULL AND im.image_url != '' THEN CONCAT('/images/', im.image_url, '.jpg') 
          ELSE '/images/no_image.jpg'
        END as image_url
      FROM 
        Products p
      LEFT JOIN 
        ImageMaster im ON p.image_id = im.image_id
      WHERE p.product_id = ?
    `;
    const [newProductRows] = await pool.query(getNewProductQuery, [newProductId]);

    if (newProductRows.length > 0) {
      res.status(201).json(newProductRows[0]);
    } else {
      res.status(500).json({ error: 'Failed to retrieve the newly added product after insertion.' });
    }
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Failed to add product', details: error.message });
  }
});

// C. Modify a specific product
app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  // Expect name, price, description, and imageId (instead of imageUrl)
  const { name, price, description, imageId } = req.body;

  // Basic validation for request body
  if (!name || price === undefined || !description) { // imageId is optional
    return res.status(400).json({ error: 'Missing required fields: name, price, and description are required.' });
  }
  if (typeof price !== 'number' || price < 0) {
    return res.status(400).json({ error: 'Price must be a non-negative number.' });
  }
  // Validate imageId if provided: should be a number (or null/undefined)
  if (imageId !== undefined && imageId !== null && typeof imageId !== 'number') {
    return res.status(400).json({ error: 'Image ID must be a number.' });
  }

  try {
    // Check if the product exists first
    const [existingProductRows] = await pool.query('SELECT * FROM Products WHERE product_id = ?', [id]);
    if (existingProductRows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const query = `
      UPDATE Products 
      SET prod_name = ?, 
          price = ?, 
          description = ?, 
          image_id = ?, /* Use the provided imageId */
          direct_image_url = NULL /* Clear direct_image_url as we are using image_id from ImageMaster */
      WHERE product_id = ?
    `;
    // The 5th parameter to query is for image_id (which is `imageId || null`)
    // The CASE statement for image_id is no longer needed as we directly set direct_image_url to NULL.
    const [result] = await pool.query(query, [name, price, description, imageId || null, id]);

    if (result.affectedRows === 0) {
      // This case should ideally be caught by the existence check above, but as a safeguard:
      return res.status(404).json({ error: 'Product not found or no changes made' });
    }

    // Fetch the updated product to return it, using the same logic as POST/GET
    const getUpdatedProductQuery = `
      SELECT 
        p.product_id, 
        p.prod_name, 
        p.price, 
        p.description, 
        p.image_id, 
        p.direct_image_url, 
        CASE 
          WHEN p.direct_image_url IS NOT NULL AND p.direct_image_url != '' THEN p.direct_image_url
          WHEN im.image_url IS NOT NULL AND im.image_url != '' THEN CONCAT('/images/', im.image_url, '.jpg') 
          ELSE '/images/no_image.jpg'
        END as image_url
      FROM 
        Products p
      LEFT JOIN 
        ImageMaster im ON p.image_id = im.image_id
      WHERE p.product_id = ?
    `;
    const [updatedProductRows] = await pool.query(getUpdatedProductQuery, [id]);

    if (updatedProductRows.length > 0) {
      res.json(updatedProductRows[0]);
    } else {
      // Should not happen if update was successful and product existed
      res.status(404).json({ error: 'Updated product not found after update.' }); 
    }

  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    res.status(500).json({ error: `Failed to update product ${id}`, details: error.message });
  }
});

// D. Delete a product
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // First, check if the product exists to provide a more specific 404 if not found
    const [existingProductRows] = await pool.query('SELECT product_id FROM Products WHERE product_id = ?', [id]);
    if (existingProductRows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const query = 'DELETE FROM Products WHERE product_id = ?';
    const [result] = await pool.query(query, [id]);

    if (result.affectedRows > 0) {
      res.json({ message: `Product with ID ${id} deleted successfully` });
    } else {
      // This case should ideally be caught by the existence check above,
      // but it's a good safeguard in case of concurrent modifications or other issues.
      res.status(404).json({ error: 'Product not found or already deleted' });
    }
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error);
    // Check for foreign key constraint errors if products are linked elsewhere (e.g., orders)
    // For now, a generic error is provided. Specific error handling can be added if needed.
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).json({ error: `Cannot delete product ${id} because it is referenced by other data.`, details: error.message });
    }
    res.status(500).json({ error: `Failed to delete product ${id}`, details: error.message });
  }
});

// New Endpoint: Get available images from ImageMaster
app.get('/api/available-images', async (req, res) => {
  try {
    const query = 'SELECT image_id as id, image_url as name_segment FROM ImageMaster ORDER BY image_id';
    const [images] = await pool.query(query);
    
    // Construct full preview paths for frontend convenience if desired, or let frontend do it.
    // For now, just sending id and the segment.
    const processedImages = images.map(img => ({
      id: img.id,
      name_segment: img.name_segment, // This is the value like 'img-4115P733'
      // Assuming all are .jpg and served from /images/ for preview purposes
      preview_path: `/images/${img.name_segment}.jpg` 
    }));
    
    res.json(processedImages);
  } catch (error) {
    console.error('Error fetching available images:', error);
    res.status(500).json({ error: 'Failed to retrieve available images', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
}); 