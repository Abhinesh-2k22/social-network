import Post from './Post';

const PostList = ({ posts }) => {
  if (!posts || posts.length === 0) {
    return (
      <div className="text-center text-gray-500 p-4">
        No posts found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map(post => (
        <Post key={post._id} post={post} refetch={() => window.location.reload()} />
      ))}
    </div>
  );
};

export default PostList; 