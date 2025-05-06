import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductList from './components/ProductList';
import AddProductForm from './components/AddProductForm';
import EditProductForm from './components/EditProductForm'; // Will be created next
import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('add'); // 'add' or 'edit'
  const [productToEdit, setProductToEdit] = useState(null); // Holds product data for editing

  const fetchProducts = async () => {
    setLoading(true); // Set loading true when re-fetching
    try {
      const response = await axios.get('http://localhost:3002/api/products');
      setProducts(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(err.response?.data?.error || 'Failed to fetch products. Please ensure backend is running and reachable.');
      setProducts([]); // Clear products on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []); // Initial fetch on mount

  const handleProductUpdate = () => {
    fetchProducts();
    setViewMode('add'); // Switch back to add mode after any update
    setProductToEdit(null); // Clear product to edit
  };

  const handleDeleteProduct = async (productId) => {
    // Ask for confirmation before deleting
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await axios.delete(`http://localhost:3002/api/products/${productId}`);
        if (response.status === 200) { // Or check for specific success message if backend sends one
          fetchProducts(); // Refresh the product list
          // Optionally show a success notification
        } else {
          // Handle non-200 success responses if backend behaves that way
          setError(response.data?.message || 'An unexpected error occurred during deletion.');
        }
      } catch (err) {
        console.error(`Error deleting product ${productId}:`, err);
        setError(err.response?.data?.error || `Failed to delete product ${productId}.`);
      }
    }
  };

  const handleEditProductTrigger = (product) => {
    console.log("Edit product triggered:", product);
    setProductToEdit(product);
    setViewMode('edit');
  };

  const handleCancelEdit = () => {
    setViewMode('add');
    setProductToEdit(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Product Maintenance</h1>
      </header>
      <main>
        {viewMode === 'add' && (
          <AddProductForm 
            onProductAdded={handleProductUpdate} 
          />
        )}
        {viewMode === 'edit' && productToEdit && (
          <EditProductForm 
            productToEdit={productToEdit} 
            onProductUpdated={handleProductUpdate} 
            onCancelEdit={handleCancelEdit} 
          />
        )}
        <ProductList 
          products={products} 
          loading={loading} 
          error={error} 
          onEditProduct={handleEditProductTrigger} 
          onDeleteProduct={handleDeleteProduct} 
        />
      </main>
    </div>
  );
}

export default App;
