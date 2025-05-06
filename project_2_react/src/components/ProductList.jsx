import React from 'react';
// import axios from 'axios'; // No longer needed here
import styles from './ProductList.module.css';

// ProductList now accepts products, loading, error, onEditProduct, and onDeleteProduct as props
const ProductList = ({ products, loading, error, onEditProduct, onDeleteProduct }) => {
  // useEffect for fetching products is removed from here

  if (loading) {
    return <div className={styles.loading}>Loading products...</div>;
  }

  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  if (!products || products.length === 0) {
    return <div className={styles.productListContainer}>No products found.</div>;
  }

  return (
    <div className={styles.productListContainer}>
      <h2>Product List</h2>
      <ul className={styles.productList}>
        {products.map((product) => (
          <li key={product.product_id} className={styles.productItem}>
            <h3>{product.prod_name}</h3>
            <p>Price: ${typeof product.price === 'number' ? product.price.toFixed(2) : 'N/A'}</p>
            <p>Description: {product.description}</p>
            {product.image_url && (
              <img 
                src={product.image_url.startsWith('http') ? product.image_url : `${import.meta.env.VITE_API_BASE_URL}${product.image_url}`}
                alt={product.prod_name} 
                className={styles.productImage} 
              />
            )}
            <div className={styles.actionsContainer}>
              <button 
                onClick={() => onEditProduct(product)} 
                className={`${styles.actionButton} ${styles.editButton}`}
              >
                Edit (✏️)
              </button>
              <button 
                onClick={() => onDeleteProduct(product.product_id)} 
                className={`${styles.actionButton} ${styles.deleteButton}`}
              >
                Delete (🗑️)
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductList; 