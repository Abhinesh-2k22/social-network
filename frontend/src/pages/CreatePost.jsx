import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';

const CREATE_POST = gql`
  mutation CreatePost($imagePath: String!, $description: String) {
    createPost(imagePath: $imagePath, description: $description) {
      _id
      imagePath
      description
      timestamp
      owner {
        _id
        username
        profile_photo
      }
    }
  }
`;

const CreatePost = () => {
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [createPost, { loading }] = useMutation(CREATE_POST, {
    onCompleted: (data) => {
      navigate(`/profile/${data.createPost.owner.username}`);
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      
      // Create a preview URL for the image
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!imageFile) {
      setError('Please select an image to upload');
      return;
    }

    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', imageFile); // Use 'file' as the field name to match the backend
      
      // First, upload the image to the server
      const uploadResponse = await fetch('http://localhost:4000/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include', // Include cookies for authentication
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }
      
      const uploadResult = await uploadResponse.json();
      
      // Then create the post with the image path
      await createPost({
        variables: {
          imagePath: uploadResult.filePath,
          description: description.trim() || null,
        },
      });
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Create a New Post</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
            Image
          </label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {imagePreview && (
            <div className="mt-2">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="max-h-64 rounded-lg"
              />
            </div>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="4"
            placeholder="Write a description for your post..."
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading || !imageFile}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            loading || !imageFile
              ? 'bg-blue-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {loading ? 'Creating...' : 'Create Post'}
        </button>
      </form>
    </div>
  );
};

export default CreatePost; 