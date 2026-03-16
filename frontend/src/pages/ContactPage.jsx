import React, { useState, useEffect } from 'react';
import CustomerNavbar from '../components/CustomerNavbar.jsx';
import { usersAPI } from '../utils/api.js';
import WhatsAppIcon from '../components/WhatsAppIcon.jsx';

function ContactPage() {
  const [ownerContact, setOwnerContact] = useState(null);

  useEffect(() => {
    loadOwnerContact();
  }, []);

  const loadOwnerContact = async () => {
    try {
      const response = await usersAPI.getOwnerContact();
      setOwnerContact(response.data);
    } catch (error) {
      console.error('Error loading owner contact:', error);
    }
  };

  const handleWhatsAppClick = () => {
    if (ownerContact) {
      const message = 'Hello! I would like to inquire about your products and services.';
      const whatsappUrl = `https://wa.me/${ownerContact.phone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleCallClick = () => {
    if (ownerContact) {
      window.location.href = `tel:${ownerContact.phone}`;
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' 
    }}>
      <CustomerNavbar />
      
      <div style={{ padding: '32px', flex: 1 }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <h1 style={{
            marginBottom: '32px',
            fontSize: '36px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textAlign: 'center'
          }}>
            CONTACT US
          </h1>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '32px',
            marginBottom: '32px'
          }}>
            {/* Company Information */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '32px',
              borderRadius: '16px',
              color: 'white',
              boxShadow: '0 10px 20px rgba(102, 126, 234, 0.3)'
            }}>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: '700', 
                marginBottom: '24px',
                borderBottom: '2px solid rgba(255,255,255,0.3)',
                paddingBottom: '12px'
              }}>
                SD HOLLOW BLOCKS
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>📍</span>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>Address</div>
                    <div style={{ opacity: 0.9, lineHeight: '1.6' }}>
                      SD Hollow Blocks<br />
                      6X44+CP4, Kunjampalayam<br />
                      Tamil Nadu<br />
                      India
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>📞</span>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>Phone</div>
                    <div style={{ opacity: 0.9 }}>
                      {ownerContact ? ownerContact.phone : 'Loading...'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>⏰</span>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>Business Hours</div>
                    <div style={{ opacity: 0.9, lineHeight: '1.6' }}>
                      Monday - Saturday: 8:00 AM - 6:00 PM<br />
                      Sunday: Closed
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>🏗️</span>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>Products</div>
                    <div style={{ opacity: 0.9, lineHeight: '1.6' }}>
                      • Hollow Blocks<br />
                      • Cement<br />
                      • M-Sand & P-Sand<br />
                      • Bricks<br />
                      • Posts & Rings
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Buttons */}
              <div style={{ 
                marginTop: '32px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px',
                paddingTop: '24px',
                borderTop: '2px solid rgba(255,255,255,0.3)'
              }}>
                <button
                  onClick={handleWhatsAppClick}
                  disabled={!ownerContact}
                  style={{
                    padding: '14px 20px',
                    backgroundColor: '#25d366',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: ownerContact ? 'pointer' : 'not-allowed',
                    fontSize: '16px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'all 0.3s ease',
                    opacity: ownerContact ? 1 : 0.6
                  }}
                  onMouseEnter={(e) => {
                    if (ownerContact) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 20px rgba(37, 211, 102, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <WhatsAppIcon size={20} color="#fff" />
                  WhatsApp Us
                </button>

                <button
                  onClick={handleCallClick}
                  disabled={!ownerContact}
                  style={{
                    padding: '14px 20px',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: '2px solid rgba(255,255,255,0.5)',
                    borderRadius: '12px',
                    cursor: ownerContact ? 'pointer' : 'not-allowed',
                    fontSize: '16px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'all 0.3s ease',
                    opacity: ownerContact ? 1 : 0.6
                  }}
                  onMouseEnter={(e) => {
                    if (ownerContact) {
                      e.target.style.backgroundColor = 'rgba(255,255,255,0.3)';
                      e.target.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(255,255,255,0.2)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <span style={{ fontSize: '20px' }}>📞</span>
                  Call Now
                </button>
              </div>
            </div>

            {/* Google Maps */}
            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '16px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: '700', 
                marginBottom: '16px',
                color: '#111827'
              }}>
                📍 Find Us on Map
              </h3>
              
              <div style={{ 
                flex: 1,
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                minHeight: '400px',
                position: 'relative'
              }}>
                {/* Google Maps iframe for Kunjampalayam, Tamil Nadu */}
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3914.8!2d78.1561!3d11.2061!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTHCsDEyJzIyLjAiTiA3OMKwMDknMjIuMCJF!5e0!3m2!1sen!2sin!4v1640000000000!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: '400px' }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="SD Hollow Blocks - 6X44+CP4 Kunjampalayam, Tamil Nadu"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                
                {/* Fallback content if map fails to load */}
                <div style={{
                  display: 'none',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  minHeight: '400px',
                  background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                  padding: '40px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '64px', marginBottom: '20px' }}>📍</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '12px' }}>
                    SD Hollow Blocks
                  </div>
                  <div style={{ fontSize: '16px', color: '#6b7280', marginBottom: '8px' }}>
                    6X44+CP4, Kunjampalayam
                  </div>
                  <div style={{ fontSize: '16px', color: '#6b7280', marginBottom: '24px' }}>
                    Tamil Nadu, India
                  </div>
                  <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '20px' }}>
                    Coordinates: 11.2061°N, 78.1561°E
                  </div>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=11.2061,78.1561"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      padding: '14px 28px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '10px',
                      fontWeight: '600',
                      fontSize: '16px',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    🗺️ Open in Google Maps
                  </a>
                  <div style={{
                    marginTop: '24px',
                    padding: '12px 20px',
                    background: '#fef3c7',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#92400e',
                    maxWidth: '400px'
                  }}>
                    💡 Map requires internet connection to display
                  </div>
                </div>
              </div>
              
              <div style={{ 
                marginTop: '16px',
                padding: '12px',
                background: '#f3f4f6',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#6b7280',
                textAlign: 'center'
              }}>
                💡 Click on the map to get directions
              </div>
            </div>
          </div>

          {/* Why Choose Us Section */}
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            padding: '32px',
            borderRadius: '16px',
            marginTop: '32px',
            border: '2px solid #bbf7d0'
          }}>
            <h3 style={{ 
              fontSize: '24px', 
              fontWeight: '700', 
              marginBottom: '24px',
              color: '#065f46',
              textAlign: 'center'
            }}>
              🌟 Why Choose SD Hollow Blocks?
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '20px'
            }}>
              <div style={{ 
                background: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>✅</div>
                <div style={{ fontWeight: '600', color: '#065f46', marginBottom: '8px' }}>
                  Quality Products
                </div>
                <div style={{ fontSize: '14px', color: '#047857', lineHeight: '1.6' }}>
                  Premium quality construction materials that meet industry standards
                </div>
              </div>

              <div style={{ 
                background: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🚚</div>
                <div style={{ fontWeight: '600', color: '#065f46', marginBottom: '8px' }}>
                  Fast Delivery
                </div>
                <div style={{ fontSize: '14px', color: '#047857', lineHeight: '1.6' }}>
                  Quick and reliable delivery service to your construction site
                </div>
              </div>

              <div style={{ 
                background: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>💰</div>
                <div style={{ fontWeight: '600', color: '#065f46', marginBottom: '8px' }}>
                  Competitive Prices
                </div>
                <div style={{ fontSize: '14px', color: '#047857', lineHeight: '1.6' }}>
                  Best prices in the market with transparent pricing
                </div>
              </div>

              <div style={{ 
                background: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🤝</div>
                <div style={{ fontWeight: '600', color: '#065f46', marginBottom: '8px' }}>
                  Expert Support
                </div>
                <div style={{ fontSize: '14px', color: '#047857', lineHeight: '1.6' }}>
                  Professional guidance and customer support throughout your project
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div style={{
            marginTop: '32px',
            padding: '32px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            textAlign: 'center',
            color: 'white'
          }}>
            <h3 style={{ 
              fontSize: '28px', 
              fontWeight: '700', 
              marginBottom: '16px'
            }}>
              Ready to Start Your Project?
            </h3>
            <p style={{ 
              fontSize: '16px', 
              marginBottom: '24px',
              opacity: 0.9,
              lineHeight: '1.6'
            }}>
              Contact us today for a quote or to discuss your construction material needs.<br />
              We're here to help make your project a success!
            </p>
            <button
              onClick={handleWhatsAppClick}
              disabled={!ownerContact}
              style={{
                padding: '16px 32px',
                backgroundColor: '#25d366',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: ownerContact ? 'pointer' : 'not-allowed',
                fontSize: '18px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.3s ease',
                opacity: ownerContact ? 1 : 0.6
              }}
              onMouseEnter={(e) => {
                if (ownerContact) {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = '0 8px 24px rgba(37, 211, 102, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <WhatsAppIcon size={24} color="#fff" />
              Get in Touch via WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;
