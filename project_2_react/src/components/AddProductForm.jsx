import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import axios from 'axios';
import styles from './AddProductForm.module.css';
import ImageSelector from './ImageSelector';

const AddProductForm = ({ onProductAdded }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    control
  } = useForm();

  const [formError, setFormError] = useState(null);
  const [selectedImagePreviewPath, setSelectedImagePreviewPath] = useState('');

  const currentImageId = watch('imageId');

  const onSubmit = async (data) => {
    setFormError(null);
    try {
      const productData = {
        name: data.name,
        price: parseFloat(data.price),
        description: data.description,
        imageId: data.imageId || null,
      };

      const response = await axios.post('http://localhost:3002/api/products', productData);
      
      if (response.status === 201) {
        onProductAdded();
        reset();
        setSelectedImagePreviewPath('');
      } else {
        setFormError(response.data?.message || 'An unexpected error occurred.');
      }
    } catch (err) {
      console.error("Error adding product:", err);
      setFormError(err.response?.data?.error || 'Failed to add product.');
    }
  };

  return (
    <div className={styles.addProductFormContainer}>
      <h2>Add New Product</h2>
      {formError && <div className={styles.errorMessage}>{formError}</div>}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className={styles.formGroup}>
          <label htmlFor="name">Product Name</label>
          <input type="text" id="name" {...register('name', { required: 'Product name is required' })} />
          {errors.name && <p className={styles.fieldError}>{errors.name.message}</p>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="price">Price</label>
          <input type="number" id="price" step="0.01" {...register('price', { required: 'Price is required', valueAsNumber: true, min: { value: 0, message: 'Price cannot be negative' } })} />
          {errors.price && <p className={styles.fieldError}>{errors.price.message}</p>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description">Description</label>
          <textarea id="description" {...register('description', { required: 'Description is required' })}></textarea>
          {errors.description && <p className={styles.fieldError}>{errors.description.message}</p>}
        </div>
        
        <input type="hidden" {...register('imageId')} />
        
        <ImageSelector 
          label="Select Product Image" 
          selectedImageId={currentImageId} 
          onImageSelect={(id, previewPath) => {
            setValue('imageId', id, { shouldValidate: true, shouldDirty: true });
            setSelectedImagePreviewPath(previewPath ? `http://localhost:3002${previewPath}` : '');
          }} 
        />

        {selectedImagePreviewPath && (
          <div className={styles.formGroup}>
            <label>Selected Image Preview:</label>
            <img src={selectedImagePreviewPath} alt="Selected product preview" className={styles.imagePreview} />
          </div>
        )}

        <button type="submit" className={styles.submitButton}>Add Product</button>
      </form>
    </div>
  );
};

export default AddProductForm; 