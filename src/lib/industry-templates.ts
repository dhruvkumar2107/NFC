import { CardSections, CardTheme, DEFAULT_SECTION_ORDER, defaultSections, defaultTheme } from './builder'

export interface TemplateFieldDef {
  key: string
  label: string
  placeholder?: string
}

export interface TemplateConfig {
  theme: CardTheme
  sections: CardSections
  fieldDefs: TemplateFieldDef[]
}

export interface TemplateSeed {
  name: string
  industry: string
  category: string
  description: string
  icon: string
  config: TemplateConfig
}

function sectionsFor(enabledKeys: string[], titleOverrides: Record<string, string> = {}): CardSections {
  const base = defaultSections()
  const enabled: Record<string, boolean> = {}
  for (const key of DEFAULT_SECTION_ORDER) enabled[key] = enabledKeys.includes(key)
  return {
    ...base,
    enabled,
    titles: { ...base.titles, ...titleOverrides },
  }
}

function make(
  name: string,
  industry: string,
  category: string,
  description: string,
  icon: string,
  enabledKeys: string[],
  fieldDefs: TemplateFieldDef[],
  titleOverrides?: Record<string, string>
): TemplateSeed {
  return {
    name,
    industry,
    category,
    description,
    icon,
    config: {
      theme: defaultTheme(),
      sections: sectionsFor(enabledKeys, titleOverrides),
      fieldDefs,
    },
  }
}

export const INDUSTRY_TEMPLATES: TemplateSeed[] = [
  make('Gym, Fitness & Personal Trainer', 'gym', 'Fitness & Wellness', 'Membership plans, trainers, class schedules and transformation galleries.', 'dumbbell',
    ['about', 'offers', 'products', 'gallery', 'team', 'schedule', 'amenities', 'enquiry', 'payment'],
    [
      { key: 'membership_trial', label: 'Free trial', placeholder: 'e.g. 1-day free trial available' },
      { key: 'facilities', label: 'Facilities', placeholder: 'Cardio, CrossFit, Steam, Sauna' },
    ]),
  make('Clothing, Fashion & Garment Shop', 'clothing', 'Retail', 'Products with sizes, colours, MRP, discounts and seasonal collections.', 'shirt',
    ['about', 'offers', 'products', 'catalogues', 'gallery', 'enquiry', 'payment'],
    [
      { key: 'sizes', label: 'Available sizes', placeholder: 'S, M, L, XL, XXL' },
      { key: 'colours', label: 'Colours', placeholder: 'Black, White, Blue' },
      { key: 'return_policy', label: 'Return policy', placeholder: '7-day exchange' },
    ]),
  make('Mobile Phone Showroom & Electronics', 'mobile', 'Electronics', 'Brands, models, specs, warranty, stock and EMI options.', 'smartphone',
    ['about', 'offers', 'products', 'emi', 'catalogues', 'gallery', 'enquiry', 'payment'],
    [
      { key: 'warranty', label: 'Warranty', placeholder: '1 year brand warranty' },
      { key: 'emi_available', label: 'EMI available', placeholder: 'No-cost EMI on select models' },
    ]),
  make('Car Showroom & Automobile Dealership', 'car', 'Automotive', 'Variants, on-road price, finance, test drive and brochures.', 'car',
    ['about', 'offers', 'products', 'emi', 'catalogues', 'gallery', 'enquiry', 'payment'],
    [
      { key: 'transmission', label: 'Transmissions', placeholder: 'Manual, Automatic, AMT' },
      { key: 'fuel_types', label: 'Fuel types', placeholder: 'Petrol, Diesel, CNG, EV' },
      { key: 'test_drive', label: 'Test drive', placeholder: 'Book a free test drive' },
    ]),
  make('Bike Showroom', 'bike', 'Automotive', 'Models, on-road price, mileage, finance and test ride.', 'bike',
    ['about', 'offers', 'products', 'emi', 'catalogues', 'gallery', 'enquiry', 'payment'],
    [
      { key: 'mileage', label: 'Mileage', placeholder: '45–60 kmpl' },
      { key: 'test_ride', label: 'Test ride', placeholder: 'Book a free test ride' },
    ]),
  make('Real Estate & Property Consultant', 'realestate', 'Real Estate', 'Listings, floor plans, amenities, site visit and brochures.', 'building',
    ['about', 'offers', 'products', 'gallery', 'amenities', 'catalogues', 'enquiry', 'payment'],
    [
      { key: 'rera', label: 'RERA number', placeholder: 'RERA registration number' },
      { key: 'site_visit', label: 'Site visit', placeholder: 'Schedule a site visit' },
    ]),
  make('Restaurant, Cafe & Bakery', 'restaurant', 'Food & Beverage', 'Menu with prices, downloadable PDF menu, offers and hours.', 'utensils',
    ['about', 'offers', 'menu', 'priceList', 'catalogues', 'gallery', 'hours', 'enquiry', 'payment'],
    [
      { key: 'cuisine', label: 'Cuisine', placeholder: 'North Indian, Chinese, Continental' },
      { key: 'hours', label: 'Opening hours', placeholder: '11:00 AM – 11:00 PM' },
      { key: 'reservation', label: 'Reservations', placeholder: 'Table reservations accepted' },
    ]),
  make('Salon, Spa & Beauty Parlour', 'salon', 'Beauty & Wellness', 'Services, packages, price list and appointment enquiries.', 'sparkles',
    ['about', 'offers', 'priceList', 'gallery', 'team', 'hours', 'enquiry', 'payment'],
    [
      { key: 'appointment', label: 'Appointments', placeholder: 'Walk-in or prior appointment' },
      { key: 'hours', label: 'Opening hours', placeholder: '10:00 AM – 8:00 PM' },
    ]),
  make('Photography & Videography Studio', 'photography', 'Creative', 'Portfolio albums, packages, price catalogue and booking.', 'camera',
    ['about', 'offers', 'products', 'gallery', 'catalogues', 'enquiry', 'payment'],
    [
      { key: 'packages', label: 'Packages', placeholder: 'Wedding, Portrait, Event, Product' },
      { key: 'booking', label: 'Booking', placeholder: 'Advance booking required' },
    ]),
  make('Hospital, Clinic & Healthcare', 'healthcare', 'Healthcare', 'Doctors, departments, timings and appointment enquiries.', 'heart',
    ['about', 'products', 'team', 'hours', 'amenities', 'enquiry', 'payment'],
    [
      { key: 'specialities', label: 'Specialities', placeholder: 'General, Ortho, Dental, Eye' },
      { key: 'hours', label: 'OPD hours', placeholder: '9:00 AM – 6:00 PM' },
      { key: 'emergency', label: 'Emergency', placeholder: '24x7 emergency care' },
    ]),
  make('Hotel & Travel Agency', 'hotel', 'Hospitality & Travel', 'Rooms, packages, amenities, gallery and booking enquiries.', 'hotel',
    ['about', 'offers', 'products', 'amenities', 'gallery', 'catalogues', 'enquiry', 'payment'],
    [
      { key: 'checkin', label: 'Check-in / Check-out', placeholder: 'Check-in 12 PM, Check-out 11 AM' },
      { key: 'packages', label: 'Packages', placeholder: 'Family, Honeymoon, Corporate' },
    ]),
  make('Jewellery Store & Luxury Retail', 'jewellery', 'Luxury', 'Collections, live rates, offers and appointment enquiries.', 'gem',
    ['about', 'offers', 'products', 'gallery', 'catalogues', 'enquiry', 'payment'],
    [
      { key: 'hallmark', label: 'Certification', placeholder: 'BIS Hallmarked' },
      { key: 'appointment', label: 'Appointments', placeholder: 'Private viewing on request' },
    ]),
  make('Furniture & Home Interiors', 'furniture', 'Home & Interiors', 'Catalogue, finishes, showroom gallery and design enquiries.', 'sofa',
    ['about', 'offers', 'products', 'gallery', 'catalogues', 'amenities', 'enquiry', 'payment'],
    [
      { key: 'materials', label: 'Materials', placeholder: 'Teak, Ply, MDF, Leather' },
      { key: 'delivery', label: 'Delivery', placeholder: 'Free delivery within city' },
      { key: 'warranty', label: 'Warranty', placeholder: '3-year warranty' },
    ]),
  make('Electronics & Home Appliances', 'appliances', 'Electronics', 'Appliances with specs, warranty, stock and EMI options.', 'washingmachine',
    ['about', 'offers', 'products', 'emi', 'catalogues', 'gallery', 'enquiry', 'payment'],
    [
      { key: 'brands', label: 'Brands', placeholder: 'Samsung, LG, Whirlpool, Bosch' },
      { key: 'warranty', label: 'Warranty', placeholder: 'Brand warranty + extended plans' },
      { key: 'installation', label: 'Installation', placeholder: 'Free installation' },
    ]),
  make('Education, Coaching & Training Institute', 'education', 'Education', 'Courses, batches, fees, faculty and admission enquiries.', 'graduation',
    ['about', 'offers', 'products', 'team', 'schedule', 'catalogues', 'enquiry', 'payment'],
    [
      { key: 'batches', label: 'Batches', placeholder: 'Morning, Evening, Weekend' },
      { key: 'demo', label: 'Demo class', placeholder: 'Free demo class available' },
      { key: 'facilities', label: 'Facilities', placeholder: 'Library, Lab, Wi-Fi' },
    ]),
  make('Freelancer, Consultant & Professional', 'freelancer', 'Professional Services', 'Services, packages, portfolio and consultation booking.', 'briefcase',
    ['about', 'products', 'gallery', 'team', 'catalogues', 'enquiry', 'payment'],
    [
      { key: 'services', label: 'Services', placeholder: 'Consulting, Design, Development' },
      { key: 'booking', label: 'Consultation', placeholder: 'Book a free 30-min call' },
    ]),
  make('Manufacturer, Wholesaler & Distributor', 'manufacturer', 'B2B & Industry', 'Product range, MOQ, catalogue and bulk enquiry.', 'factory',
    ['about', 'products', 'priceList', 'catalogues', 'gallery', 'enquiry', 'payment'],
    [
      { key: 'moq', label: 'Minimum order', placeholder: 'MOQ: 100 units' },
      { key: 'markets', label: 'Markets served', placeholder: 'Domestic & Export' },
      { key: 'gst', label: 'GSTIN', placeholder: 'GST number' },
    ]),
  make('General Retail Shop', 'retail', 'Retail', 'Products, offers, gallery and enquiries for any retail store.', 'shoppingbag',
    ['about', 'offers', 'products', 'priceList', 'gallery', 'enquiry', 'payment'],
    [
      { key: 'delivery', label: 'Delivery', placeholder: 'Home delivery available' },
      { key: 'hours', label: 'Opening hours', placeholder: '9:00 AM – 9:00 PM' },
    ]),
  make('Universal / Other Business', 'general', 'General', 'A flexible template that fits any business.', 'grid',
    ['about', 'offers', 'gallery', 'products', 'catalogues', 'enquiry', 'payment'],
    [
      { key: 'services', label: 'Services', placeholder: 'Describe your services' },
    ]),
]

export function templateByIndustry(industry: string): TemplateSeed | undefined {
  return INDUSTRY_TEMPLATES.find((t) => t.industry === industry)
}
