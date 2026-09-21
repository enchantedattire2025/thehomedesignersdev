import React, { useState } from 'react';
import { Search, Filter, Star, Award, CheckCircle, Info, Layers, Hammer, Shield, Zap, X } from 'lucide-react';

interface Material {
  id: string;
  name: string;
  category: string;
  description: string;
  applications: string[];
  benefits: string[];
  considerations: string[];
  image: string;
  brands: Brand[];
  priceRange: string;
  durability: number;
  maintenance: 'Low' | 'Medium' | 'High';
  ecoFriendly: boolean;
}

interface Brand {
  name: string;
  rating: number;
  priceCategory: 'Budget' | 'Mid-Range' | 'Premium' | 'Luxury';
  specialties: string[];
  pros: string[];
  cons: string[];
  warranty: string;
}

const Materials = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  const categories = [
    'All', 'Plywood & Boards', 'Hardware', 'Channels & Profiles', 
    'Laminates & Veneers', 'Countertops', 'Flooring', 'Lighting', 'Accessories'
  ];

  const materials: Material[] = [
    {
      id: 'marine-plywood',
      name: 'Marine Plywood',
      category: 'Plywood & Boards',
      description: 'High-quality waterproof plywood made with phenolic resin, ideal for moisture-prone areas.',
      applications: ['Kitchen cabinets', 'Bathroom vanities', 'Outdoor furniture', 'Boat building'],
      benefits: ['100% waterproof', 'High strength', 'Termite resistant', 'Long-lasting'],
      considerations: ['Higher cost', 'Limited thickness options', 'Requires skilled installation'],
      image: 'https://images.pexels.com/photos/5974391/pexels-photo-5974391.jpeg?auto=compress&cs=tinysrgb&w=400',
      priceRange: '₹80-150 per sq ft',
      durability: 9,
      maintenance: 'Low',
      ecoFriendly: true,
      brands: [
        {
          name: 'Century Ply',
          rating: 4.8,
          priceCategory: 'Premium',
          specialties: ['Marine grade', 'BWP grade', 'Fire retardant'],
          pros: ['Excellent quality', 'Wide availability', 'Good warranty'],
          cons: ['Premium pricing', 'Limited designs'],
          warranty: '25 years'
        },
        {
          name: 'Greenply',
          rating: 4.6,
          priceCategory: 'Mid-Range',
          specialties: ['Eco-friendly', 'Moisture resistant', 'Termite proof'],
          pros: ['Good value', 'Eco-friendly options', 'Reliable quality'],
          cons: ['Limited premium options', 'Availability issues'],
          warranty: '15 years'
        },
        {
          name: 'Kitply',
          rating: 4.4,
          priceCategory: 'Budget',
          specialties: ['BWR grade', 'Commercial grade', 'Decorative'],
          pros: ['Affordable', 'Good for basic use', 'Wide distribution'],
          cons: ['Lower durability', 'Limited warranty'],
          warranty: '10 years'
        }
      ]
    },
    {
      id: 'mdf-board',
      name: 'MDF (Medium Density Fiberboard)',
      category: 'Plywood & Boards',
      description: 'Engineered wood product made from wood fibers, wax, and resin, perfect for painted finishes.',
      applications: ['Cabinet doors', 'Shelving', 'Decorative panels', 'Furniture making'],
      benefits: ['Smooth surface', 'Easy to paint', 'Cost-effective', 'Consistent density'],
      considerations: ['Not waterproof', 'Heavy weight', 'Formaldehyde emissions'],
      image: 'https://images.pexels.com/photos/5974392/pexels-photo-5974392.jpeg?auto=compress&cs=tinysrgb&w=400',
      priceRange: '₹35-65 per sq ft',
      durability: 6,
      maintenance: 'Medium',
      ecoFriendly: false,
      brands: [
        {
          name: 'Durian',
          rating: 4.5,
          priceCategory: 'Premium',
          specialties: ['High density', 'Low formaldehyde', 'Moisture resistant'],
          pros: ['Superior finish', 'Low emission', 'Good machining'],
          cons: ['Higher cost', 'Limited availability'],
          warranty: '5 years'
        },
        {
          name: 'Action Tesa',
          rating: 4.2,
          priceCategory: 'Mid-Range',
          specialties: ['Standard MDF', 'Moisture resistant', 'Fire retardant'],
          pros: ['Good quality', 'Reasonable price', 'Wide availability'],
          cons: ['Standard features', 'Average durability'],
          warranty: '3 years'
        }
      ]
    },
    {
      id: 'soft-close-hinges',
      name: 'Soft Close Hinges',
      category: 'Hardware',
      description: 'Premium cabinet hinges with hydraulic mechanism for smooth, silent closing.',
      applications: ['Kitchen cabinets', 'Wardrobe doors', 'Bathroom vanities', 'Office furniture'],
      benefits: ['Silent operation', 'Prevents slamming', 'Extends door life', 'Premium feel'],
      considerations: ['Higher cost', 'Requires precise installation', 'May need adjustment'],
      image: 'https://images.pexels.com/photos/5974393/pexels-photo-5974393.jpeg?auto=compress&cs=tinysrgb&w=400',
      priceRange: '₹150-500 per piece',
      durability: 8,
      maintenance: 'Low',
      ecoFriendly: true,
      brands: [
        {
          name: 'Hettich',
          rating: 4.9,
          priceCategory: 'Premium',
          specialties: ['German engineering', 'Soft close', 'Heavy duty'],
          pros: ['Excellent quality', 'Long lasting', 'Smooth operation'],
          cons: ['Premium pricing', 'Limited local service'],
          warranty: '10 years'
        },
        {
          name: 'Blum',
          rating: 4.8,
          priceCategory: 'Luxury',
          specialties: ['Austrian quality', 'Innovative design', 'Heavy duty'],
          pros: ['Top quality', 'Innovative features', 'Excellent warranty'],
          cons: ['Very expensive', 'Limited availability'],
          warranty: '15 years'
        },
        {
          name: 'Hafele',
          rating: 4.6,
          priceCategory: 'Premium',
          specialties: ['German quality', 'Wide range', 'Architectural hardware'],
          pros: ['Good quality', 'Wide selection', 'Good support'],
          cons: ['Premium pricing', 'Complex installation'],
          warranty: '8 years'
        }
      ]
    },
    {
      id: 'aluminum-channels',
      name: 'Aluminum Channels',
      category: 'Channels & Profiles',
      description: 'Lightweight, corrosion-resistant aluminum profiles for structural and decorative applications.',
      applications: ['Window frames', 'Door frames', 'Partition systems', 'LED strip housing'],
      benefits: ['Lightweight', 'Corrosion resistant', 'Easy to work with', 'Recyclable'],
      considerations: ['Thermal expansion', 'Requires proper sealing', 'Limited load capacity'],
      image: 'https://images.pexels.com/photos/5974394/pexels-photo-5974394.jpeg?auto=compress&cs=tinysrgb&w=400',
      priceRange: '₹120-300 per meter',
      durability: 8,
      maintenance: 'Low',
      ecoFriendly: true,
      brands: [
        {
          name: 'Jindal Aluminium',
          rating: 4.7,
          priceCategory: 'Mid-Range',
          specialties: ['Structural profiles', 'Anodized finish', 'Custom extrusions'],
          pros: ['Good quality', 'Wide range', 'Competitive pricing'],
          cons: ['Limited premium options', 'Standard finishes'],
          warranty: '10 years'
        },
        {
          name: 'Hindalco',
          rating: 4.5,
          priceCategory: 'Premium',
          specialties: ['High-grade alloys', 'Architectural profiles', 'Custom solutions'],
          pros: ['Excellent quality', 'Custom options', 'Good support'],
          cons: ['Higher cost', 'Longer lead times'],
          warranty: '15 years'
        }
      ]
    },
    {
      id: 'high-pressure-laminate',
      name: 'High Pressure Laminate (HPL)',
      category: 'Laminates & Veneers',
      description: 'Durable decorative surface material made from multiple layers of kraft paper and resin.',
      applications: ['Kitchen countertops', 'Cabinet surfaces', 'Table tops', 'Wall panels'],
      benefits: ['Scratch resistant', 'Easy to clean', 'Wide design options', 'Cost-effective'],
      considerations: ['Can chip at edges', 'Heat sensitive', 'Visible seams'],
      image: 'https://images.pexels.com/photos/5974395/pexels-photo-5974395.jpeg?auto=compress&cs=tinysrgb&w=400',
      priceRange: '₹80-250 per sq ft',
      durability: 7,
      maintenance: 'Low',
      ecoFriendly: false,
      brands: [
        {
          name: 'Formica',
          rating: 4.8,
          priceCategory: 'Premium',
          specialties: ['Wide design range', 'High durability', 'Innovative textures'],
          pros: ['Excellent designs', 'High quality', 'Good warranty'],
          cons: ['Premium pricing', 'Limited availability'],
          warranty: '10 years'
        },
        {
          name: 'Merino',
          rating: 4.6,
          priceCategory: 'Mid-Range',
          specialties: ['Indian designs', 'Good quality', 'Wide availability'],
          pros: ['Local designs', 'Good value', 'Easy availability'],
          cons: ['Limited premium options', 'Standard quality'],
          warranty: '7 years'
        },
        {
          name: 'Sunmica',
          rating: 4.3,
          priceCategory: 'Budget',
          specialties: ['Basic laminates', 'Wide distribution', 'Affordable'],
          pros: ['Very affordable', 'Wide availability', 'Basic quality'],
          cons: ['Limited designs', 'Lower durability'],
          warranty: '5 years'
        }
      ]
    },
    {
      id: 'quartz-countertop',
      name: 'Engineered Quartz',
      category: 'Countertops',
      description: 'Man-made stone surface combining natural quartz with polymer resins for superior performance.',
      applications: ['Kitchen countertops', 'Bathroom vanities', 'Island tops', 'Bar counters'],
      benefits: ['Non-porous', 'Stain resistant', 'Consistent patterns', 'Low maintenance'],
      considerations: ['High cost', 'Heavy weight', 'Professional installation required'],
      image: 'https://images.pexels.com/photos/5974396/pexels-photo-5974396.jpeg?auto=compress&cs=tinysrgb&w=400',
      priceRange: '₹350-800 per sq ft',
      durability: 9,
      maintenance: 'Low',
      ecoFriendly: true,
      brands: [
        {
          name: 'Caesarstone',
          rating: 4.9,
          priceCategory: 'Luxury',
          specialties: ['Premium quality', 'Wide color range', 'Innovative designs'],
          pros: ['Excellent quality', 'Beautiful designs', 'Great warranty'],
          cons: ['Very expensive', 'Limited availability'],
          warranty: '15 years'
        },
        {
          name: 'Silestone',
          rating: 4.8,
          priceCategory: 'Premium',
          specialties: ['Antibacterial surface', 'High durability', 'Unique colors'],
          pros: ['Hygienic surface', 'Great quality', 'Good support'],
          cons: ['Premium pricing', 'Limited dealers'],
          warranty: '25 years'
        },
        {
          name: 'Pokarna',
          rating: 4.4,
          priceCategory: 'Mid-Range',
          specialties: ['Indian brand', 'Good quality', 'Competitive pricing'],
          pros: ['Local support', 'Good value', 'Decent quality'],
          cons: ['Limited designs', 'Average finish'],
          warranty: '10 years'
        }
      ]
    },
    {
      id: 'led-strip-lights',
      name: 'LED Strip Lights',
      category: 'Lighting',
      description: 'Flexible LED lighting strips for accent, task, and ambient lighting applications.',
      applications: ['Under cabinet lighting', 'Cove lighting', 'Accent lighting', 'Display lighting'],
      benefits: ['Energy efficient', 'Long lifespan', 'Flexible installation', 'Dimmable options'],
      considerations: ['Requires proper heat management', 'Quality varies widely', 'Driver compatibility'],
      image: 'https://images.pexels.com/photos/1111318/pexels-photo-1111318.jpeg?auto=compress&cs=tinysrgb&w=400',
      priceRange: '₹200-800 per meter',
      durability: 8,
      maintenance: 'Low',
      ecoFriendly: true,
      brands: [
        {
          name: 'Philips',
          rating: 4.8,
          priceCategory: 'Premium',
          specialties: ['High CRI', 'Smart controls', 'Long lifespan'],
          pros: ['Excellent quality', 'Smart features', 'Great warranty'],
          cons: ['Premium pricing', 'Complex setup'],
          warranty: '5 years'
        },
        {
          name: 'Syska',
          rating: 4.5,
          priceCategory: 'Mid-Range',
          specialties: ['Good quality', 'Wide range', 'Affordable'],
          pros: ['Good value', 'Local support', 'Reliable'],
          cons: ['Limited smart features', 'Average lifespan'],
          warranty: '3 years'
        },
        {
          name: 'Wipro',
          rating: 4.3,
          priceCategory: 'Budget',
          specialties: ['Basic LED strips', 'Affordable', 'Wide availability'],
          pros: ['Very affordable', 'Easy availability', 'Basic quality'],
          cons: ['Limited features', 'Shorter lifespan'],
          warranty: '2 years'
        }
      ]
    }
  ];

  const filteredMaterials = materials.filter(material => {
    const matchesCategory = selectedCategory === 'All' || material.category === selectedCategory;
    const matchesSearch = !searchTerm ||
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.applications.some(app => app.toLowerCase().includes(searchTerm.toLowerCase())) ||
      material.brands.some(brand => brand.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const getPriceCategoryColor = (category: string) => {
    switch (category) {
      case 'Budget': return 'bg-green-100 text-green-800';
      case 'Mid-Range': return 'bg-blue-100 text-blue-800';
      case 'Premium': return 'bg-purple-100 text-purple-800';
      case 'Luxury': return 'bg-gold-100 text-gold-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-secondary-800 mb-4">
            Interior Materials Guide
          </h1>
          <p className="text-lg text-gray-600">
            Comprehensive guide to interior materials, their applications, and brand comparisons for informed decision making.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-secondary-800">Filter Materials</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search materials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Materials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredMaterials.map((material) => (
            <div key={material.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="relative">
                <img
                  src={material.image}
                  alt={material.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {material.category}
                  </span>
                </div>
                {material.ecoFriendly && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-green-500 text-white p-2 rounded-full" title="Eco-Friendly">
                      <Layers className="w-4 h-4" />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6">
                <h3 className="text-xl font-semibold text-secondary-800 mb-2">
                  {material.name}
                </h3>
                
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {material.description}
                </p>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Durability:</span>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: 10 }, (_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i < material.durability ? 'bg-primary-500' : 'bg-gray-200'
                          }`}
                        />
                      ))}
                      <span className="ml-2 font-medium">{material.durability}/10</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Maintenance:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      material.maintenance === 'Low' ? 'bg-green-100 text-green-800' :
                      material.maintenance === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {material.maintenance}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Eco-Friendly:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      material.ecoFriendly ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {material.ecoFriendly ? 'Yes' : 'No'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Price Range:</span>
                    <span className="font-medium text-primary-600">{material.priceRange}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Top Applications:</h4>
                  <div className="flex flex-wrap gap-1">
                    {material.applications.slice(0, 3).map((app, index) => (
                      <span key={index} className="bg-accent-100 text-accent-800 px-2 py-1 rounded-md text-xs">
                        {app}
                      </span>
                    ))}
                    {material.applications.length > 3 && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs">
                        +{material.applications.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedMaterial(material)}
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <Info className="w-4 h-4" />
                  <span>View Details & Brands</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredMaterials.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No materials found matching your criteria. Try adjusting your filters.
            </p>
          </div>
        )}
      </div>

      {/* Material Detail Modal */}
      {selectedMaterial && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-secondary-800">{selectedMaterial.name}</h2>
              <button
                onClick={() => setSelectedMaterial(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div>
                  <img
                    src={selectedMaterial.image}
                    alt={selectedMaterial.name}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
                
                <div>
                  <p className="text-gray-600 mb-6">{selectedMaterial.description}</p>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-secondary-800 mb-2 flex items-center space-x-2">
                        <Hammer className="w-4 h-4" />
                        <span>Applications</span>
                      </h4>
                      <ul className="space-y-1">
                        {selectedMaterial.applications.map((app, index) => (
                          <li key={index} className="text-gray-600 flex items-center space-x-2">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>{app}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-secondary-800 mb-2 flex items-center space-x-2">
                        <Shield className="w-4 h-4" />
                        <span>Benefits</span>
                      </h4>
                      <ul className="space-y-1">
                        {selectedMaterial.benefits.map((benefit, index) => (
                          <li key={index} className="text-gray-600 flex items-center space-x-2">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-secondary-800 mb-2 flex items-center space-x-2">
                        <Zap className="w-4 h-4" />
                        <span>Considerations</span>
                      </h4>
                      <ul className="space-y-1">
                        {selectedMaterial.considerations.map((consideration, index) => (
                          <li key={index} className="text-gray-600 flex items-center space-x-2">
                            <Info className="w-3 h-3 text-yellow-500" />
                            <span>{consideration}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Brand Comparison */}
              <div>
                <h3 className="text-xl font-bold text-secondary-800 mb-6 flex items-center space-x-2">
                  <Award className="w-5 h-5" />
                  <span>Brand Comparison & Ratings</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {selectedMaterial.brands.map((brand, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-secondary-800">{brand.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriceCategoryColor(brand.priceCategory)}`}>
                          {brand.priceCategory}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 mb-4">
                        <div className="flex items-center">
                          {getRatingStars(brand.rating)}
                        </div>
                        <span className="font-semibold text-gray-700">{brand.rating}/5</span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h5 className="font-medium text-gray-700 mb-1">Specialties:</h5>
                          <div className="flex flex-wrap gap-1">
                            {brand.specialties.map((specialty, i) => (
                              <span key={i} className="bg-primary-100 text-primary-800 px-2 py-1 rounded-md text-xs">
                                {specialty}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h5 className="font-medium text-green-700 mb-1">Pros:</h5>
                          <ul className="space-y-1">
                            {brand.pros.map((pro, i) => (
                              <li key={i} className="text-sm text-gray-600 flex items-center space-x-1">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                <span>{pro}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h5 className="font-medium text-red-700 mb-1">Cons:</h5>
                          <ul className="space-y-1">
                            {brand.cons.map((con, i) => (
                              <li key={i} className="text-sm text-gray-600 flex items-center space-x-1">
                                <X className="w-3 h-3 text-red-500" />
                                <span>{con}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="pt-2 border-t border-gray-200">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Warranty:</span>
                            <span className="font-medium text-secondary-800">{brand.warranty}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Materials;