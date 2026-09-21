import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, MapPin, User, ArrowLeft, Clock, Ruler, IndianRupee as Rupee, Tag, ExternalLink } from 'lucide-react';

const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchProject();
    }
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch from database first, fallback to demo data if access is restricted
      let projectData = null;
      let projectError = null;

      try {
        const { data, error } = await supabase
          .from('customers')
          .select(`
            *,
            assigned_designer:designers(id, name, email, specialization, rating, total_reviews, experience, profile_image),
            project_images(id, image_url, caption, is_primary, display_order)
          `)
          .eq('id', id)
          .eq('assignment_status', 'completed')
          .single();

        projectData = data;
        projectError = error;
      } catch (dbError) {
        console.log('Database access restricted, checking demo projects');
        projectError = dbError;
      }

      // If database access fails or project not found, check demo projects
      if (projectError || !projectData) {
        const demoProjects = generateDemoCompletedProjects();
        projectData = demoProjects.find(p => p.id === id);
        
        if (!projectData) {
          setError('Project not found. This project may not be completed yet or does not exist.');
          return;
        }
      }

      // Fetch accepted quote for this project
      let quoteData = null;
      
      // Only try to fetch quotes if we have real project data
      if (projectData.id && typeof projectData.id === 'string' && projectData.id.includes('-')) {
        try {
          const { data, error: quoteError } = await supabase
            .from('designer_quotes')
            .select('*')
            .eq('project_id', id)
            .eq('customer_accepted', true)
            .eq('status', 'accepted')
            .maybeSingle();
          
          if (!quoteError) {
            quoteData = data;
          }
        } catch (quoteError) {
          console.log('Could not fetch quote data');
        }
      }


      // Transform the data to match the existing component structure
      const transformedProject = {
        id: projectData.id,
        title: projectData.project_name,
        designer: projectData.assigned_designer?.name || 'Unknown Designer',
        designerId: projectData.assigned_designer?.id || '',
        category: 'Residential',
        location: projectData.location,
        budget: quoteData ? `₹${quoteData.total_amount.toLocaleString()}` : projectData.budget_range,
        duration: calculateProjectDuration(projectData.created_at, projectData.updated_at),
        completedDate: new Date(projectData.updated_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        area: projectData.project_area || 'Not specified',
        client: projectData.name,
        description: projectData.requirements,
        challenge: projectData.challenges_solutions || projectData.special_requirements || 'Creating a functional and beautiful space that meets all the client requirements within the specified budget and timeline.',
        solution: projectData.challenges_solutions ? '' : `Our team worked closely with ${projectData.name} to understand their vision and requirements. We implemented a comprehensive design solution that maximized the available space while incorporating their preferred style and functional needs.`,
        images: extractProjectImages(projectData.project_images || []),
        materials: projectData.materials_cost_breakdown || generateMaterialsFromQuote(quoteData),
        timeline: projectData.project_timeline_details || generateProjectTimeline(projectData.created_at, projectData.updated_at),
        tags: generateProjectTags(projectData),
        features: generateProjectFeatures(projectData, quoteData),
        designerRating: projectData.assigned_designer?.rating || 0,
        designerReviews: projectData.assigned_designer?.total_reviews || 0,
        designerExperience: projectData.assigned_designer?.experience || 0,
        designerImage: projectData.assigned_designer?.profile_image
      };

      setProject(transformedProject);
    } catch (error: any) {
      console.error('Error fetching project:', error);
      setError(error.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const generateDemoCompletedProjects = () => {
    return [
      {
        id: 'demo-1',
        project_name: 'Modern Luxury Apartment',
        location: 'Mumbai',
        budget_range: '₹15-20 Lakhs',
        property_type: '3 BHK Apartment',
        project_area: '1200 sq ft',
        name: 'Rohit & Priya Malhotra',
        requirements: 'Contemporary design with modern amenities, open kitchen concept, and premium finishes throughout the apartment.',
        special_requirements: 'Maximizing natural light while maintaining privacy, incorporating smart home technology, and creating a seamless flow between living spaces.',
        room_types: ['Living Room', 'Kitchen', 'Bedroom', 'Bathroom'],
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-04-20T00:00:00Z',
        assigned_designer: {
          id: 'designer-1',
          name: 'Priya Sharma',
          email: 'priya@example.com',
          specialization: 'Modern & Contemporary',
          rating: 4.9,
          total_reviews: 127,
          experience: 8,
          profile_image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'
        }
      },
      {
        id: 'demo-2',
        project_name: 'Traditional Family Home',
        location: 'Delhi',
        budget_range: '₹25-30 Lakhs',
        property_type: 'Villa/Independent House',
        project_area: '2500 sq ft',
        name: 'Sharma Family',
        requirements: 'Traditional Indian design with modern functionality, incorporating cultural elements and family-friendly spaces.',
        special_requirements: 'Creating dedicated spaces for religious ceremonies, accommodating joint family living, and blending traditional aesthetics with contemporary comfort.',
        room_types: ['Living Room', 'Kitchen', 'Bedroom', 'Dining Room', 'Pooja Room'],
        created_at: '2024-02-01T00:00:00Z',
        updated_at: '2024-06-15T00:00:00Z',
        assigned_designer: {
          id: 'designer-2',
          name: 'Rajesh Kumar',
          email: 'rajesh@example.com',
          specialization: 'Traditional Indian',
          rating: 4.8,
          total_reviews: 98,
          experience: 12,
          profile_image: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400'
        }
      },
      {
        id: 'demo-3',
        project_name: 'Minimalist Studio Design',
        location: 'Bangalore',
        budget_range: '₹8-12 Lakhs',
        property_type: 'Studio Apartment',
        project_area: '600 sq ft',
        name: 'Sneha Kapoor',
        requirements: 'Clean, minimalist design maximizing space efficiency with smart storage solutions and natural lighting.',
        special_requirements: 'Creating distinct zones within a single space, incorporating work-from-home setup, and maintaining an uncluttered aesthetic.',
        room_types: ['Living Room', 'Kitchen', 'Bedroom'],
        created_at: '2024-03-10T00:00:00Z',
        updated_at: '2024-05-25T00:00:00Z',
        assigned_designer: {
          id: 'designer-3',
          name: 'Anita Desai',
          email: 'anita@example.com',
          specialization: 'Minimalist Design',
          rating: 4.9,
          total_reviews: 85,
          experience: 6,
          profile_image: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=400'
        }
      },
      {
        id: 'demo-4',
        project_name: 'Luxury Penthouse Renovation',
        location: 'Gurgaon',
        budget_range: 'Above ₹50 Lakhs',
        property_type: 'Penthouse',
        project_area: '3500 sq ft',
        name: 'Agarwal Family',
        requirements: 'High-end luxury renovation with premium materials, smart home integration, and panoramic city views.',
        special_requirements: 'Integrating cutting-edge technology, creating entertainment spaces, and maximizing the terrace area for outdoor living.',
        room_types: ['Living Room', 'Kitchen', 'Bedroom', 'Dining Room', 'Study Room', 'Balcony'],
        created_at: '2024-01-20T00:00:00Z',
        updated_at: '2024-07-30T00:00:00Z',
        assigned_designer: {
          id: 'designer-4',
          name: 'Vikram Singh',
          email: 'vikram@example.com',
          specialization: 'Luxury & High-End',
          rating: 4.7,
          total_reviews: 89,
          experience: 15,
          profile_image: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400'
        }
      },
      {
        id: 'demo-5',
        project_name: 'Eco-Friendly Home Design',
        location: 'Hyderabad',
        budget_range: '₹18-25 Lakhs',
        property_type: '2 BHK Apartment',
        project_area: '1100 sq ft',
        name: 'Reddy Family',
        requirements: 'Sustainable design using eco-friendly materials, energy-efficient solutions, and natural ventilation systems.',
        special_requirements: 'Implementing rainwater harvesting, solar energy solutions, and using only sustainable materials throughout the project.',
        room_types: ['Living Room', 'Kitchen', 'Bedroom', 'Bathroom'],
        created_at: '2024-02-15T00:00:00Z',
        updated_at: '2024-05-10T00:00:00Z',
        assigned_designer: {
          id: 'designer-5',
          name: 'Meera Reddy',
          email: 'meera@example.com',
          specialization: 'Eco-Friendly Design',
          rating: 4.8,
          total_reviews: 28,
          experience: 7,
          profile_image: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=400'
        }
      },
      {
        id: 'demo-6',
        project_name: 'Corporate Office Redesign',
        location: 'Pune',
        budget_range: '₹35-40 Lakhs',
        property_type: 'Commercial Space',
        project_area: '4000 sq ft',
        name: 'TechCorp Solutions',
        requirements: 'Modern office space design promoting productivity, collaboration, and employee well-being with ergonomic furniture.',
        special_requirements: 'Creating flexible workspaces, implementing biophilic design elements, and ensuring compliance with corporate branding guidelines.',
        room_types: ['Office', 'Meeting Room', 'Reception'],
        created_at: '2024-01-05T00:00:00Z',
        updated_at: '2024-04-15T00:00:00Z',
        assigned_designer: {
          id: 'designer-6',
          name: 'Arjun Patel',
          email: 'arjun@example.com',
          specialization: 'Commercial Design',
          rating: 4.6,
          total_reviews: 45,
          experience: 10,
          profile_image: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400'
        }
      }
    ];
  };
  const calculateProjectDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      return `${years} year${years > 1 ? 's' : ''}${remainingMonths > 0 ? ` ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''}`;
    }
  };

  const extractProjectImages = (projectImages: any[]) => {
    const images = [];
    let imageId = 1;

    // Extract images from project_images table (uploaded by designers)
    if (projectImages && projectImages.length > 0) {
      // Sort by display_order, then by is_primary
      const sortedImages = [...projectImages].sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return (a.display_order || 0) - (b.display_order || 0);
      });

      sortedImages.forEach((img: any) => {
        images.push({
          id: imageId++,
          url: img.image_url,
          title: img.caption || `Project Image ${imageId - 1}`,
          description: img.caption || 'Project completion photo'
        });
      });
    }

    // Only add default images if no real images are available
   /* if (images.length === 0) {
      const defaultImages;
      
      = [
        {
          url: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800',
          title: 'Project Overview',
          description: 'Complete project transformation'
        },
        {
          url: 'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=800',
          title: 'Living Area',
          description: 'Beautifully designed living space'
        },
        {
          url: 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=800',
          title: 'Bedroom',
          description: 'Comfortable and stylish bedroom design'
        },
        {
          url: 'https://images.pexels.com/photos/1571461/pexels-photo-1571461.jpeg?auto=compress&cs=tinysrgb&w=800',
          title: 'Kitchen',
          description: 'Modern and functional kitchen space'
        }
      ]; 

      defaultImages.forEach(img => {
        images.push({
          id: imageId++,
          ...img
        });
      });
    } */

    return images;
  };

  const generateMaterialsFromQuote = (quote: any) => {
    if (!quote) {
      return [
        { name: 'Premium Materials', usage: 'Throughout the project', cost: '₹2,50,000' },
        { name: 'Quality Finishes', usage: 'All surfaces and fixtures', cost: '₹1,80,000' },
        { name: 'Designer Furniture', usage: 'Custom and branded pieces', cost: '₹85,000' },
        { name: 'Lighting Solutions', usage: 'Ambient and task lighting', cost: '₹45,000' },
        { name: 'Accessories & Decor', usage: 'Final styling touches', cost: '₹35,000' }
      ];
    }

    // If we have quote data, we could fetch the actual items
    // For now, return a structure based on the quote total
    const total = quote.total_amount;
    return [
      { name: 'Materials & Supplies', usage: 'Primary construction materials', cost: `₹${Math.round(total * 0.4).toLocaleString()}` },
      { name: 'Labor & Installation', usage: 'Professional installation services', cost: `₹${Math.round(total * 0.3).toLocaleString()}` },
      { name: 'Furniture & Fixtures', usage: 'Custom and branded furniture', cost: `₹${Math.round(total * 0.2).toLocaleString()}` },
      { name: 'Design & Consultation', usage: 'Professional design services', cost: `₹${Math.round(total * 0.1).toLocaleString()}` }
    ];
  };

  const generateProjectTimeline = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    // Generate timeline phases based on project duration
    const phases = [
      { 
        phase: 'Planning & Design', 
        duration: `${Math.ceil(totalDays * 0.2)} days`, 
        description: 'Initial consultation, space planning, and design development' 
      },
      { 
        phase: 'Preparation', 
        duration: `${Math.ceil(totalDays * 0.1)} days`, 
        description: 'Material procurement and site preparation' 
      },
      { 
        phase: 'Execution', 
        duration: `${Math.ceil(totalDays * 0.6)} days`, 
        description: 'Implementation of design plan and installation work' 
      },
      { 
        phase: 'Finishing & Styling', 
        duration: `${Math.ceil(totalDays * 0.1)} days`, 
        description: 'Final touches, furniture placement, and styling' 
      }
    ];
    
    return phases;
  };

  const generateProjectTags = (projectData: any) => {
    const tags = [];
    
    // Add property type as tag
    if (projectData.property_type) {
      if (projectData.property_type.includes('BHK')) {
        tags.push(projectData.property_type.split(' ')[0] + ' ' + projectData.property_type.split(' ')[1]);
      } else {
        tags.push(projectData.property_type.split(' ')[0]);
      }
    }
    
    // Add room types as tags
    if (projectData.room_types && projectData.room_types.length > 0) {
      projectData.room_types.slice(0, 2).forEach((room: string) => {
        tags.push(room.replace(' Room', ''));
      });
    }
    
    // Add style tags based on requirements
    const requirements = projectData.requirements?.toLowerCase() || '';
    if (requirements.includes('modern')) tags.push('Modern');
    if (requirements.includes('traditional')) tags.push('Traditional');
    if (requirements.includes('minimal')) tags.push('Minimalist');
    if (requirements.includes('luxury')) tags.push('Luxury');
    if (requirements.includes('contemporary')) tags.push('Contemporary');
    
    // Add budget-based tag
    if (projectData.budget_range) {
      if (projectData.budget_range.includes('Above ₹50')) {
        tags.push('Luxury');
      } else if (projectData.budget_range.includes('₹20-50')) {
        tags.push('Premium');
      }
    }
    
    return tags.slice(0, 5); // Limit to 5 tags
  };

  const generateProjectFeatures = (projectData: any, quote: any) => {
    const features = [];
    
    // Add features based on room types
    if (projectData.room_types && projectData.room_types.length > 0) {
      if (projectData.room_types.includes('Kitchen')) {
        features.push('Modern kitchen design');
      }
      if (projectData.room_types.includes('Living Room')) {
        features.push('Open concept living space');
      }
      if (projectData.room_types.includes('Bedroom')) {
        features.push('Custom bedroom solutions');
      }
      if (projectData.room_types.includes('Bathroom')) {
        features.push('Luxury bathroom fixtures');
      }
    }
    
    // Add features based on requirements
    const requirements = projectData.requirements?.toLowerCase() || '';
    if (requirements.includes('storage')) {
      features.push('Smart storage solutions');
    }
    if (requirements.includes('lighting')) {
      features.push('Designer lighting systems');
    }
    if (requirements.includes('furniture')) {
      features.push('Custom furniture design');
    }
    
    // Add quote-based features
    if (quote && quote.total_amount > 1000000) {
      features.push('Premium material finishes');
    }
    
    // Add default features if we have less than 6
    const defaultFeatures = [
      'Professional interior design',
      'Quality material selection',
      'Expert project management',
      'Timely project completion',
      'Customer satisfaction guarantee',
      'Post-completion support'
    ];
    
    defaultFeatures.forEach(feature => {
      if (features.length < 6 && !features.includes(feature)) {
        features.push(feature);
      }
    });
    
    return features.slice(0, 6);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-lg mb-4">
            <p className="font-medium">Project not found</p>
            <p className="text-sm">{error || 'This project may not be completed yet or does not exist.'}</p>
          </div>
          <Link to="/projects" className="btn-primary">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link to="/projects" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h1 className="text-3xl lg:text-4xl font-bold text-secondary-800 mb-4">
                {project.title}
              </h1>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center space-x-2 text-gray-600">
                  <User className="w-5 h-5" />
                  <div>
                    <p className="text-sm">Designer</p>
                    <Link to={`/designers/${project.designerId}`} className="font-medium text-primary-600 hover:text-primary-700">
                      {project.designer}
                    </Link>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 text-gray-600">
                  <MapPin className="w-5 h-5" />
                  <div>
                    <p className="text-sm">Location</p>
                    <p className="font-medium">{project.location}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 text-gray-600">
                  <Calendar className="w-5 h-5" />
                  <div>
                    <p className="text-sm">Completed</p>
                    <p className="font-medium">{project.completedDate}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 text-gray-600">
                  <Ruler className="w-5 h-5" />
                  <div>
                    <p className="text-sm">Area</p>
                    <p className="font-medium">{project.area}</p>
                  </div>
                </div>
              </div>

             <p className="text-gray-600 leading-relaxed mb-6">
                {typeof project.description === 'string'
                  ? project.description
                      .split('\n')
                      .filter(line => line.trim() !== '0')
                      .join('\n')
                  : project.description}
              </p>

              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag, index) => (
                  <span key={index} className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-secondary-800 mb-4">Project Details</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Budget</span>
                    <span className="font-semibold text-secondary-800">{project.budget}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-semibold text-secondary-800">{project.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category</span>
                    <span className="font-semibold text-secondary-800">{project.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Client</span>
                    <span className="font-semibold text-secondary-800">{project.client}</span>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-semibold text-secondary-800 mb-3">Key Features</h4>
                  <ul className="space-y-2">
                    {project.features.map((feature, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-secondary-800 mb-6">Project Gallery</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {project.images.map((image) => (
              <div key={image.id} className="group relative overflow-hidden rounded-lg">
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-lg font-semibold mb-1">{image.title}</h3>
                    <p className="text-sm">{image.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Challenge & Solution */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-secondary-800 mb-6">Challenges & Solutions</h2>

            {project.solution ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-primary-600 mb-3">The Challenge</h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{project.challenge}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-primary-600 mb-3">Our Solution</h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{project.solution}</p>
                </div>
              </div>
            ) : (
              <div className="text-gray-600 leading-relaxed whitespace-pre-line">{project.challenge}</div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-secondary-800 mb-6">Project Timeline</h2>

            {Array.isArray(project.timeline) ? (
              <div className="space-y-4">
                {project.timeline.map((phase, index) => (
                  <div key={index} className="flex space-x-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                      {index < project.timeline.length - 1 && (
                        <div className="w-0.5 h-16 bg-gray-200 mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-8">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-secondary-800">{phase.phase}</h3>
                        <span className="bg-accent-100 text-accent-800 px-2 py-1 rounded-md text-xs font-medium">
                          {phase.duration}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">{phase.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-600 leading-relaxed whitespace-pre-line">{project.timeline}</div>
            )}
          </div>
        </div>

        {/* Materials Used */}
        <div className="bg-white rounded-xl shadow-lg p-8 mt-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Rupee className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-secondary-800">Materials & Cost Breakdown</h2>
              <p className="text-sm text-gray-500">Detailed breakdown of all materials and costs for this project</p>
            </div>
          </div>

          {Array.isArray(project.materials) ? (
            (() => {
              const parsedCosts = project.materials.map((m: any) => {
                const raw = typeof m.cost === 'string' ? m.cost.replace(/[₹,]/g, '') : String(m.cost);
                return parseFloat(raw) || 0;
              });
              const total = parsedCosts.reduce((a: number, b: number) => a + b, 0);
              const colors = ['bg-blue-500', 'bg-teal-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500', 'bg-emerald-500'];
              const lightColors = ['bg-blue-50 text-blue-700', 'bg-teal-50 text-teal-700', 'bg-amber-50 text-amber-700', 'bg-rose-50 text-rose-700', 'bg-violet-50 text-violet-700', 'bg-emerald-50 text-emerald-700'];

              return (
                <div>
                  {/* Stacked cost distribution bar */}
                  <div className="mb-6">
                    <p className="text-sm font-medium text-gray-600 mb-2">Cost Distribution</p>
                    <div className="flex h-4 rounded-full overflow-hidden w-full">
                      {project.materials.map((m: any, i: number) => {
                        const pct = total > 0 ? (parsedCosts[i] / total) * 100 : 0;
                        return (
                          <div
                            key={i}
                            className={`${colors[i % colors.length]} transition-all`}
                            style={{ width: `${pct}%` }}
                            title={`${m.name}: ${pct.toFixed(1)}%`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-3">
                      {project.materials.map((m: any, i: number) => {
                        const pct = total > 0 ? (parsedCosts[i] / total) * 100 : 0;
                        return (
                          <div key={i} className="flex items-center space-x-1.5">
                            <div className={`w-3 h-3 rounded-full ${colors[i % colors.length]}`} />
                            <span className="text-xs text-gray-600">{m.name} ({pct.toFixed(0)}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-secondary-800 text-white">
                          <th className="text-center py-3 px-4 font-semibold w-12">#</th>
                          <th className="text-left py-3 px-4 font-semibold">Material / Item</th>
                          <th className="text-left py-3 px-4 font-semibold">Usage / Scope</th>
                          <th className="text-center py-3 px-4 font-semibold w-20">Share</th>
                          <th className="text-right py-3 px-4 font-semibold w-36">Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {project.materials.map((material: any, index: number) => {
                          const pct = total > 0 ? (parsedCosts[index] / total) * 100 : 0;
                          return (
                            <tr
                              key={index}
                              className={`border-b border-gray-100 transition-colors hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                            >
                              <td className="py-3.5 px-4 text-center text-gray-400 font-mono text-xs">
                                {String(index + 1).padStart(2, '0')}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="font-semibold text-secondary-800">{material.name}</span>
                              </td>
                              <td className="py-3.5 px-4 text-gray-500">{material.usage}</td>
                              <td className="py-3.5 px-4 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${lightColors[index % lightColors.length]}`}>
                                  {pct.toFixed(0)}%
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <span className="font-bold text-primary-600 text-sm">{material.cost}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-secondary-800 text-white">
                          <td className="py-4 px-4" colSpan={3}>
                            <span className="font-bold text-base">Total Project Cost</span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="text-secondary-200 text-xs">100%</span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="font-bold text-white text-lg">{project.budget}</span>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="text-gray-600 leading-relaxed whitespace-pre-line">{project.materials}</div>
          )}
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-primary-500 to-secondary-600 rounded-xl p-8 mt-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Inspired by this project?
          </h2>
          <p className="text-primary-100 mb-6">
            Get in touch with {project.designer} to discuss your interior design needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to={`/designers/${project.designerId}`}
              className="bg-white text-primary-600 hover:bg-gray-100 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              View Designer Profile
            </Link>
            <button className="border-2 border-white text-white hover:bg-white hover:text-primary-600 px-6 py-3 rounded-lg font-semibold transition-colors">
              Get Similar Design
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;