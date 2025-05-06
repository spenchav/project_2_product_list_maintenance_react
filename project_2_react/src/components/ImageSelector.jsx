import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './ImageSelector.module.css';

const ImageSelector = ({ selectedImageId, onImageSelect, label = "Select Product Image" }) => {
  const [availableImages, setAvailableImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAvailableImages = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:3002/api/available-images');
        setAvailableImages(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching available images:", err);
        setError(err.response?.data?.error || 'Failed to load available images.');
        setAvailableImages([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAvailableImages();
  }, []);

  if (loading) {
    return <div className={styles.loading}>Loading images...</div>;
  }

  if (error) {
    return <div className={styles.error}>Error loading images: {error}</div>;
  }

  if (availableImages.length === 0) {
    return <div className={styles.info}>No images available for selection.</div>;
  }

  return (
    <div className={styles.imageSelectorContainer}>
      {label && <label>{label}</label>}
      <div className={styles.imageGrid}>
        {availableImages.map((image) => (
          <div
            key={image.id}
            className={`${styles.imageItem} ${selectedImageId === image.id ? styles.selected : ''}`}
            onClick={() => onImageSelect(image.id, image.preview_path)}
            title={image.name_segment}
          >
            <img 
              src={`http://localhost:3002${image.preview_path}`} 
              alt={image.name_segment} 
            />
            <div className={styles.imageName}>{image.name_segment}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageSelector; 