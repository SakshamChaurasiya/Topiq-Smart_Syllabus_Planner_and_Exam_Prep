import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { feedAPI } from '../api/feed.api';
import { useAuth } from '../context/AuthContext';
import { LoadingScreen } from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import LevelBadge from '../components/gamification/LevelBadge';
import CreatePostModal from '../components/ui/CreatePostModal';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const PostCard = ({ post, currentUser, onUpvote, onReport, onDelete }) => {
  const isOwn = currentUser?._id === post.author?._id ||
                currentUser?._id === post.userId;
  const typeLabels = {
    'note': '📝 Note',
    'summary': '📋 Summary',
    'resource': '🔗 Resource',
    'flashcard-share': '✨ Flashcards',
  };
  const typeColors = {
    'note': 'var(--info)',
    'summary': 'var(--success)',
    'resource': 'var(--warning)',
    'flashcard-share': 'var(--accent)',
  };

  return (
    <div className="card animate-slide-up" style={{ padding:'18px 20px' }}>
      {/* Author row */}
      <div style={{ display:'flex', justifyContent:'space-between',
        alignItems:'flex-start', marginBottom:12, gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {post.author?.publicUsername ? (
            <Link to={`/u/${post.author.publicUsername}`} className="author-link-container">
              {/* Avatar initial */}
              <div style={{ width:34, height:34, borderRadius:'50%',
                background:'var(--accent)', display:'flex', alignItems:'center',
                justifyContent:'center', color:'#fff', fontWeight:800,
                fontSize:'0.9rem', flexShrink:0, cursor: 'pointer' }}>
                {post.author?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <div className="author-link-name" style={{ display:'flex', alignItems:'center', gap:4, fontWeight:700, fontSize:'0.85rem',
                  color:'var(--txt)' }}>
                  {post.author?.name || 'Student'}
                  {post.author?.level && (
                    <span style={{ marginLeft:6 }}>
                      <LevelBadge level={post.author.level} size="sm" />
                    </span>
                  )}
                </div>
                <div style={{ fontSize:'0.7rem', color:'var(--txt-3)' }}>
                  {post.author?.institution || 'Unknown College'} ·{' '}
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </div>
              </div>
            </Link>
          ) : (
            <>
              {/* Avatar initial */}
              <div style={{ width:34, height:34, borderRadius:'50%',
                background:'var(--accent)', display:'flex', alignItems:'center',
                justifyContent:'center', color:'#fff', fontWeight:800,
                fontSize:'0.9rem', flexShrink:0 }}>
                {post.author?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:4, fontWeight:700, fontSize:'0.85rem',
                  color:'var(--txt)' }}>
                  {post.author?.name || 'Student'}
                  {post.author?.level && (
                    <span style={{ marginLeft:6 }}>
                      <LevelBadge level={post.author.level} size="sm" />
                    </span>
                  )}
                </div>
                <div style={{ fontSize:'0.7rem', color:'var(--txt-3)' }}>
                  {post.author?.institution || 'Unknown College'} ·{' '}
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </div>
              </div>
            </>
          )}
        </div>
        {/* Type badge + subject tag */}
        <div style={{ display:'flex', gap:6, flexShrink:0, flexWrap:'wrap',
          justifyContent:'flex-end' }}>
          <span className="badge" style={{
            background: `${typeColors[post.type]}22`,
            color: typeColors[post.type],
            fontSize:'0.65rem' }}>
            {typeLabels[post.type]}
          </span>
          <span className="badge badge-muted" style={{ fontSize:'0.65rem' }}>
            {post.subjectTag}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontWeight:700, fontSize:'0.95rem', marginBottom:6,
          color:'var(--txt)' }}>{post.title}</div>
        {post.description && (
          <div style={{ fontSize:'0.83rem', color:'var(--txt-2)',
            lineHeight:1.6 }}>{post.description}</div>
        )}
      </div>

      {/* Attachment preview */}
      {post.attachmentType === 'pdf' && post.attachmentUrl && (
        <a href={post.attachmentUrl} target="_blank" rel="noopener noreferrer"
          style={{ display:'inline-flex', alignItems:'center', gap:6,
            padding:'6px 12px', background:'var(--surface-2)',
            border:'1px solid var(--border)', borderRadius:'var(--r)',
            fontSize:'0.78rem', color:'var(--txt-2)',
            textDecoration:'none', marginBottom:12 }}>
          📄 View PDF
        </a>
      )}
      {post.attachmentType === 'image' && post.attachmentUrl && (
        <img src={post.attachmentUrl} alt="attachment"
          style={{ maxHeight:200, borderRadius:'var(--r-md)',
            objectFit:'cover', marginBottom:12, display:'block' }} />
      )}
      {post.attachmentType === 'link' && post.resourceUrl && (
        <a href={post.resourceUrl} target="_blank" rel="noopener noreferrer"
          style={{ display:'inline-flex', alignItems:'center', gap:6,
            padding:'6px 12px', background:'var(--surface-2)',
            border:'1px solid var(--border)', borderRadius:'var(--r)',
            fontSize:'0.78rem', color:'var(--accent)',
            textDecoration:'none', marginBottom:12 }}>
          🔗 Open Resource
        </a>
      )}

      {/* Actions row */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
        {/* Upvote button */}
        <button
          className={`btn btn-sm ${post.hasUpvoted ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => onUpvote(post._id)}
          style={{ display:'flex', alignItems:'center', gap:5 }}
        >
          ▲ {post.upvoteCount || 0}
        </button>

        {/* Report — only show if not own post */}
        {!isOwn && (
          <button className="btn btn-ghost btn-sm"
            onClick={() => onReport(post._id)}
            style={{ fontSize:'0.72rem', color:'var(--txt-3)' }}>
            Report
          </button>
        )}

        {/* Delete — only own posts */}
        {isOwn && (
          <button className="btn btn-ghost btn-sm"
            onClick={() => onDelete(post._id)}
            style={{ fontSize:'0.72rem', color:'var(--danger)' }}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [scope, setScope]               = useState('college'); // 'college' | 'worldwide'
  const [activeSubject, setActiveSubject] = useState(null);   // null = All
  const [subjectTags, setSubjectTags]   = useState([]);       // unique tags from loaded posts
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [reportingPostId, setReportingPostId] = useState(null); // for confirm dialog
  const [deletingPostId, setDeletingPostId]   = useState(null);

  const fetchFeed = async (newPage = 1, reset = false) => {
    // reset=true: replace posts (scope/subject changed)
    // reset=false: append posts (load more)
    if (newPage === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const params = { scope, page: newPage, limit: 10 };
      if (activeSubject) params.subject = activeSubject;
      const res = await feedAPI.getFeed(params);
      const { posts: newPosts, totalPages: tp } = res.data.data;
      if (reset || newPage === 1) {
        setPosts(newPosts);
        // Extract unique subject tags from all loaded posts
        const tags = [...new Set(newPosts.map(p => p.subjectTag).filter(Boolean))];
        setSubjectTags(tags);
      } else {
        setPosts(prev => {
          const merged = [...prev, ...newPosts];
          const tags = [...new Set(merged.map(p => p.subjectTag).filter(Boolean))];
          setSubjectTags(tags);
          return merged;
        });
      }
      setTotalPages(tp);
      setPage(newPage);
    } catch (err) {
      toast.error('Failed to load feed.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { fetchFeed(1, true); }, [scope, activeSubject]);

  const handleUpvote = async (postId) => {
    try {
      const res = await feedAPI.toggleUpvote(postId);
      const { upvoteCount, hasUpvoted } = res.data.data;
      setPosts(prev => prev.map(p =>
        p._id === postId ? { ...p, upvoteCount, hasUpvoted } : p
      ));
    } catch { toast.error('Failed to update upvote.'); }
  };

  const handleReport = async () => {
    if (!reportingPostId) return;
    try {
      await feedAPI.reportPost(reportingPostId);
      toast.success('Post reported.');
      setPosts(prev => prev.filter(p => p._id !== reportingPostId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to report post.');
    } finally {
      setReportingPostId(null);
    }
  };

  const handleDelete = async (postId) => {
    try {
      await feedAPI.deletePost(postId);
      toast.success('Post deleted.');
      setPosts(prev => prev.filter(p => p._id !== postId));
    } catch { toast.error('Failed to delete post.'); }
    finally { setDeletingPostId(null); }
  };

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
    setShowCreateModal(false);
    toast.success('Post shared!');
  };

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h1>Study Feed</h1>
          <p>Share notes, resources, and summaries with your college</p>
        </div>
        <button className="btn btn-primary btn-md" onClick={() => setShowCreateModal(true)}>
          + Share Resource
        </button>
      </div>

      {/* Scope toggle — College / Worldwide */}
      <div className="filter-tabs" style={{ marginBottom: 16, display:'inline-flex' }}>
        <button
          className={`filter-tab ${scope === 'college' ? 'active' : ''}`}
          onClick={() => { setScope('college'); setActiveSubject(null); }}
        >
          My College
        </button>
        <button
          className={`filter-tab ${scope === 'worldwide' ? 'active' : ''}`}
          onClick={() => { setScope('worldwide'); setActiveSubject(null); }}
        >
          Worldwide
        </button>
      </div>

      {/* Subject filter chips */}
      {subjectTags.length > 0 && (
        <div style={{ display:'flex', gap:8, overflowX:'auto', marginBottom:20,
          paddingBottom:4, scrollbarWidth:'none' }}>
          <button
            className={`filter-tab ${!activeSubject ? 'active' : ''}`}
            style={{ flexShrink:0 }}
            onClick={() => setActiveSubject(null)}
          >
            All
          </button>
          {subjectTags.map(tag => (
            <button
              key={tag}
              className={`filter-tab ${activeSubject === tag ? 'active' : ''}`}
              style={{ flexShrink:0 }}
              onClick={() => setActiveSubject(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Post list */}
      {loading ? <LoadingScreen text="Loading feed..." /> : (
        posts.length === 0 ? (
          <div className="card" style={{ textAlign:'center', padding:'48px 24px', color:'var(--txt-3)' }}>
            <div style={{ fontSize:'2rem', marginBottom:12 }}>📭</div>
            <div style={{ fontWeight:700, marginBottom:8 }}>
              {scope === 'college' ? 'No posts from your college yet.' : 'No posts yet.'}
            </div>
            <div style={{ fontSize:'0.85rem' }}>Be the first to share a resource!</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {posts.map((post, idx) => (
              <PostCard
                key={post._id}
                post={post}
                currentUser={user}
                onUpvote={handleUpvote}
                onReport={(id) => setReportingPostId(id)}
                onDelete={(id) => setDeletingPostId(id)}
              />
            ))}
          </div>
        )
      )}

      {/* Load more */}
      {!loading && page < totalPages && (
        <div style={{ textAlign:'center', marginTop:24 }}>
          <button
            className="btn btn-secondary btn-md"
            onClick={() => fetchFeed(page + 1, false)}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      {/* Create post modal — rendered here, component built in Prompt 6 */}
      {showCreateModal && (
        <CreatePostModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handlePostCreated}
          userSubjects={[]} // pass user's subject names for autocomplete if available
        />
      )}

      {/* Report confirmation — use existing Modal component */}
      <Modal
        isOpen={!!reportingPostId}
        onClose={() => setReportingPostId(null)}
        title="Report Post"
        footer={
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button className="btn btn-secondary btn-sm"
              onClick={() => setReportingPostId(null)}>Cancel</button>
            <button className="btn btn-danger btn-sm"
              onClick={handleReport}>Report</button>
          </div>
        }
      >
        <p style={{ fontSize:'0.88rem', color:'var(--txt-2)' }}>
          Are you sure you want to report this post? Posts with 3 or more
          reports are automatically hidden.
        </p>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        isOpen={!!deletingPostId}
        onClose={() => setDeletingPostId(null)}
        title="Delete Post"
        footer={
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button className="btn btn-secondary btn-sm"
              onClick={() => setDeletingPostId(null)}>Cancel</button>
            <button className="btn btn-danger btn-sm"
              onClick={() => handleDelete(deletingPostId)}>Delete</button>
          </div>
        }
      >
        <p style={{ fontSize:'0.88rem', color:'var(--txt-2)' }}>
          This will permanently delete your post and any attached file.
          This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
