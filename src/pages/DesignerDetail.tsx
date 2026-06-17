import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, MapPin, Calendar, Award, Phone, Mail, ArrowLeft, ExternalLink, User, Navigation } from 'lucide-react';
import { FaInstagram } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import AuthModal from '../components/AuthModal';
import type { Designer } from '../lib/supabase';

interface Testimonial {
  id: string;
  customer_id: string;
  project_id: string;
  rating: number;
  title: string;
  comment: string;
  would_recommend: boolean;
  verified_purchase: boolean;
  created_at: string;
  customer_name?: string;
  project_name?: string;
}

const DesignerDetail = () => {
  const { id } = useParams();
  const { user, isDesigner } = useAuth();
  const navigate = useNavigate();
  const [designer, setDesigner] = useState<Designer | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    if (id) {
      fetchDesigner(id);
    }
  }, [id]);

  const fetchDesigner = async (designerId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('designers')
        .select('*')
        .eq('id', designerId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!data) {
        setError('Designer not found');
        return;
      }

      setDesigner(data);

      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          id,
          customer_id,
          project_id,
          rating,
          title,
          comment,
          would_recommend,
          verified_purchase,
          created_at
        `)
        .eq('designer_id', designerId)
        .order('created_at', { ascending: false });

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
      } else if (reviewsData) {
        const enrichedTestimonials = await Promise.all(
          reviewsData.map(async (review) => {
            let customerName = 'Anonymous';
            let projectName = 'Project';

            const { data: projectData } = await supabase
              .from('customers')
              .select('name, project_name')
              .eq('id', review.project_id)
              .maybeSingle();

            if (projectData) {
              customerName = projectData.name;
              projectName = projectData.project_name;
            }

            return {
              ...review,
              customer_name: customerName,
              project_name: projectName
            };
          })
        );

        setTestimonials(enrichedTestimonials);
      }
    } catch (error: any) {
      console.error('Error fetching designer:', error);
      setError(error.message || 'Failed to load designer details');
    } finally {
      setLoading(false);
    }
  };

  const handleContactAction = (action: 'phone' | 'email' | 'website') => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!designer) return;

    switch (action) {
      case 'phone':
        if (designer.phone) {
          window.open(`tel:${designer.phone}`, '_self');
        }
        break;
      case 'email':
        window.open(`mailto:${designer.email}`, '_self');
        break;
      case 'website':
        if (designer.website) {
          const url = designer.website.startsWith('http') ? designer.website : `https://${designer.website}`;
          window.open(url, '_blank', 'noopener,noreferrer');
        }
        break;
    }
  };

  const handleGetDirections = () => {
    if (!designer?.google_location_url) return;
    const url = designer.google_location_url.startsWith('http')
      ? designer.google_location_url
      : `https://maps.google.com/?q=${encodeURIComponent(designer.google_location_url)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleGetQuote = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    // Redirect to customer registration or project creation
    navigate('/register-customer');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading designer details...</p>
        </div>
      </div>
    );
  }

  if (error || !designer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-lg mb-4">
            <p className="font-medium">Error loading designer details</p>
            <p className="text-sm">{error || 'Designer not found'}</p>
          </div>
          <Link to="/designers" className="btn-primary">
            Back to Designers
          </Link>
        </div>
      </div>
    );
  }


  const mockPortfolio = designer.portfolio_images.map((image, index) => ({
    id: index + 1,
    title: `Project ${index + 1}`,
    image: image,
    category: 'Residential'
  }));

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Link to="/designers" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Designers
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Designer Info */}
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex flex-col md:flex-row items-start space-y-6 md:space-y-0 md:space-x-8">
                  <div className="w-32 h-32 mx-auto md:mx-0 flex-shrink-0">
                    {designer.profile_image ? (
                      <img
                        src={designer.profile_image}
                        alt={designer.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary-500 rounded-full flex items-center justify-center">
                        <User className="w-16 h-16 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start space-x-3 mb-2">
                      <h1 className="text-3xl font-bold text-secondary-800">
                        {designer.name}
                      </h1>
                      {designer.is_verified && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xl text-primary-600 font-medium mb-4">
                      {designer.specialization}
                    </p>
                    
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4 text-gray-600">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{designer.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{designer.experience} years experience</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Award className="w-4 h-4" />
                        <span>{designer.total_projects} projects completed</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center md:justify-start space-x-4 mb-6">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${
                                i < Math.floor(designer.rating)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-semibold">{designer.rating}</span>
                        <span className="text-gray-600">({designer.total_reviews} reviews)</span>
                      </div>
                    </div>

                    {designer.bio && (
                      <p className="text-gray-600 leading-relaxed">
                        {designer.bio}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Services */}
              {designer.services && designer.services.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-secondary-800 mb-6">Services Offered</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {designer.services.map((service, index) => (
                      <div key={index} className="bg-primary-50 text-primary-800 px-4 py-3 rounded-lg text-center font-medium">
                        {service}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Portfolio */}
              {mockPortfolio.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-secondary-800 mb-6">Portfolio</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {mockPortfolio.map((project) => (
                      <div key={project.id} className="group relative">
                        <div className="relative overflow-hidden rounded-lg">
                          <img
                            src={project.image}
                            alt={project.title}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <ExternalLink className="w-8 h-8 text-white" />
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-secondary-800 mt-3 group-hover:text-primary-600 transition-colors">
                          {project.title}
                        </h3>
                        <p className="text-gray-600">{project.category}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Materials Expertise */}
              {designer.materials_expertise && designer.materials_expertise.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-secondary-800 mb-6">Materials Expertise</h2>
                  <div className="flex flex-wrap gap-3">
                    {designer.materials_expertise.map((material, index) => (
                      <span key={index} className="bg-accent-100 text-accent-800 px-4 py-2 rounded-full text-sm font-medium">
                        {material}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Testimonials */}
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-secondary-800 mb-6">Client Testimonials</h2>
                {testimonials.length > 0 ? (
                  <div className="space-y-6">
                    {testimonials.map((testimonial) => (
                      <div key={testimonial.id} className="border-l-4 border-primary-500 pl-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-lg text-secondary-800 mb-1">{testimonial.title}</h3>
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < testimonial.rating
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="font-semibold text-secondary-800">{testimonial.customer_name}</span>
                              {testimonial.verified_purchase && (
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                                  Verified
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(testimonial.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-3 leading-relaxed">{testimonial.comment}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-primary-600 font-medium">
                            Project: {testimonial.project_name}
                          </p>
                          {testimonial.would_recommend && (
                            <span className="text-sm text-green-600 font-medium flex items-center">
                              <span className="mr-1">✓</span> Recommends
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">No testimonials yet.</p>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Card */}
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
                <h3 className="text-xl font-bold text-secondary-800 mb-4">Contact Designer</h3>
                
                {designer.starting_price && (
                  <div className="space-y-4 mb-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Starting from</p>
                      <p className="text-2xl font-bold text-primary-600">{designer.starting_price}</p>
                    </div>
                  </div>
                )}

                {user ? (
                  <div className="space-y-3 mb-6">
                    {designer.phone && (
                      <button
                        onClick={() => handleContactAction('phone')}
                        className="flex items-center space-x-3 text-gray-600 hover:text-primary-600 transition-colors w-full text-left"
                      >
                        <Phone className="w-5 h-5" />
                        <span>{designer.phone}</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleContactAction('email')}
                      className="flex items-center space-x-3 text-gray-600 hover:text-primary-600 transition-colors w-full text-left"
                    >
                      <Mail className="w-5 h-5" />
                      <span>{designer.email}</span>
                    </button>
                    {designer.website && (
                      <button
                        onClick={() => handleContactAction('website')}
                        className="flex items-center space-x-3 text-gray-600 hover:text-primary-600 transition-colors w-full text-left"
                      >
                        <ExternalLink className="w-5 h-5" />
                        <span>{designer.website}</span>
                      </button>
                    )}
                    {designer.instagram_url && (
                      <a
                        href={designer.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 text-gray-600 hover:text-pink-500 transition-colors w-full text-left"
                      >
                        <FaInstagram style={{ width: '20px', height: '20px' }} />
                        <span>Instagram Portfolio</span>
                      </a>
                    )}
                    {designer.google_location_url && (
                      <button
                        onClick={handleGetDirections}
                        className="flex items-center justify-center space-x-2 w-full bg-green-600 hover:bg-green-700 text-white py-2.5 px-4 rounded-lg font-semibold transition-colors mt-2"
                      >
                        <Navigation className="w-4 h-4" />
                        <span>Get Directions</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-blue-800 text-sm text-center">
                      Please sign in to view contact information and get in touch with this designer.
                    </p>
                  </div>
                )}

                {user && !isDesigner && (
                  <div className="space-y-3">
                    <button
                      onClick={handleGetQuote}
                      className="w-full btn-primary"
                    >
                      Get Quote
                    </button>
                  </div>
                )}
              </div>

              {/* Awards */}
              {designer.awards && designer.awards.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-secondary-800 mb-4">Awards & Recognition</h3>
                  <div className="space-y-3">
                    {designer.awards.map((award, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <Award className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-600 text-sm">{award}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onModeChange={setAuthMode}
        onAuthSuccess={() => {
          setShowAuthModal(false);
          // Refresh the page to show contact info
          window.location.reload();
        }}
      />
    </>
  );
};

export default DesignerDetail;