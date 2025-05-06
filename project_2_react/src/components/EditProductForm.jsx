import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import styles from './EditProductForm.module.css'; // Use its own styles
import ImageSelector from './ImageSelector';

const EditProductForm = ({ productToEdit, onProductUpdated, onCancelEdit }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm({
    defaultValues: { // Pre-fill form with productToEdit data
      name: productToEdit?.prod_name || '',
      price: productToEdit?.price || 0,
      description: productToEdit?.description || '',
      // imageId will be set based on productToEdit.image_id or productToEdit.direct_image_url logic
      imageId: productToEdit?.image_id || null 
    }
  });

  const [formError, setFormError] = useState(null);
  const [selectedImagePreviewPath, setSelectedImagePreviewPath] = useState('');

  const currentImageId = watch('imageId');

  // Effect to set initial imageId and preview for the product being edited
  useEffect(() => {
    if (productToEdit) {
      setValue('imageId', productToEdit.image_id || null);
      // If productToEdit.image_url is a full path (from direct_image_url or constructed from ImageMaster),
      // we can use it for preview directly.
      if (productToEdit.image_url) {
          // Ensure we use the full path for local images from backend, or direct URL as is
        const previewUrl = productToEdit.image_url.startsWith('http') 
                             ? productToEdit.image_url 
                             : `http://localhost:3002${productToEdit.image_url}`;
        setSelectedImagePreviewPath(previewUrl);
      }
    }
  }, [productToEdit, setValue]);

  const onSubmit = async (data) => {
    setFormError(null);
    try {
      const productData = {
        name: data.name,
        price: parseFloat(data.price),
        description: data.description,
        imageId: data.imageId || null,
      };

      const response = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/products/${productToEdit.product_id}`, productData);
      
      if (response.status === 200) {
        onProductUpdated(); // This will refresh list and switch view in App.jsx
        // No need to reset() here as the component will unmount or props change
      } else {
        setFormError(response.data?.message || 'An unexpected error occurred.');
      }
    } catch (err) {
      console.error("Error updating product:", err);
      setFormError(err.response?.data?.error || 'Failed to update product.');
    }
  };

  return (
    <div className={styles.editProductFormContainer}>
      <h2>Edit Product (ID: {productToEdit.product_id})</h2>
      {formError && <div className={styles.errorMessage}>{formError}</div>}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className={styles.formGroup}>
          <label htmlFor="edit-name">Product Name</label>
          <input type="text" id="edit-name" {...register('name', { required: 'Product name is required' })} />
          {errors.name && <p className={styles.fieldError}>{errors.name.message}</p>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="edit-price">Price</label>
          <input type="number" id="edit-price" step="0.01" {...register('price', { required: 'Price is required', valueAsNumber: true, min: { value: 0, message: 'Price cannot be negative' } })} />
          {errors.price && <p className={styles.fieldError}>{errors.price.message}</p>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="edit-description">Description</label>
          <textarea id="edit-description" {...register('description', { required: 'Description is required' })}></textarea>
          {errors.description && <p className={styles.fieldError}>{errors.description.message}</p>}
        </div>
        
        <input type="hidden" {...register('imageId')} />
        <ImageSelector 
          label="Change Product Image (Optional)" 
          selectedImageId={currentImageId} 
          onImageSelect={(id, previewPath) => {
            setValue('imageId', id, { shouldValidate: true, shouldDirty: true });
            setSelectedImagePreviewPath(previewPath ? `http://localhost:3002${previewPath}` : '');
          }} 
        />
        {errors.imageId && <p className={styles.fieldError}>{errors.imageId.message}</p>}

        {selectedImagePreviewPath && (
          <div className={styles.formGroup}>
            <label>Current/Selected Image Preview:</label>
            <img src={selectedImagePreviewPath} alt="Product preview" className={styles.imagePreview} />
          </div>
        )}

        <div className={styles.formActions}>
          <button type="submit" className={styles.submitButton}>Save Changes</button>
          <button type="button" onClick={onCancelEdit} className={styles.cancelButton}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default EditProductForm; 