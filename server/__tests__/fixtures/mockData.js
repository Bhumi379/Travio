/**
 * Test Fixtures - Sample Data for Testing
 */

export const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  collegeId: 'BV12345',
  contactNumber: '9876543210',
  hashedPassword: '$2a$10$hashedpassword',
  profilePicture: 'https://example.com/pic.jpg',
  bio: 'Test bio',
  location: {
    type: 'Point',
    coordinates: [77.2000, 28.5355]
  },
  otpVerified: true,
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01')
};

export const mockRide = {
  _id: '507f1f77bcf86cd799439012',
  initiatorId: '507f1f77bcf86cd799439011',
  pickup: {
    name: 'Banasthali Campus Gate',
    address: 'Banasthali Vidyapith, Rajasthan',
    latitude: 28.5355,
    longitude: 77.2000,
    type: 'Point',
    coordinates: [77.2000, 28.5355]
  },
  destination: {
    name: 'Delhi Central Station',
    address: 'New Delhi',
    latitude: 28.6439,
    longitude: 77.2567,
    type: 'Point',
    coordinates: [77.2567, 28.6439]
  },
  departureTime: new Date('2024-02-01T10:00:00'),
  departureDate: '2024-02-01',
  availableSeats: 3,
  seatsPerPrice: [3],
  price: 500,
  vehicleType: 'car',
  vehicleNumber: 'DL01AB1234',
  description: 'Comfortable ride with AC',
  participants: ['507f1f77bcf86cd799439011'],
  status: 'active',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01')
};

export const mockRideRequest = {
  _id: '507f1f77bcf86cd799439013',
  rideId: '507f1f77bcf86cd799439012',
  userId: '507f1f77bcf86cd799439014',
  status: 'pending',
  seatsRequested: 1,
  requestedAt: new Date('2024-01-15'),
  respondedAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01')
};

export const mockChat = {
  _id: '507f1f77bcf86cd799439015',
  participants: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439014'],
  rideId: '507f1f77bcf86cd799439012',
  messages: [
    {
      senderId: '507f1f77bcf86cd799439011',
      text: 'Are you available?',
      timestamp: new Date('2024-01-10T10:00:00'),
      read: true
    },
    {
      senderId: '507f1f77bcf86cd799439014',
      text: 'Yes, I am!',
      timestamp: new Date('2024-01-10T10:05:00'),
      read: true
    }
  ],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01')
};

export const mockReview = {
  _id: '507f1f77bcf86cd799439016',
  rideId: '507f1f77bcf86cd799439012',
  reviewerId: '507f1f77bcf86cd799439014',
  rating: 5,
  comment: 'Great ride, very comfortable!',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01')
};

export const mockNotification = {
  _id: '507f1f77bcf86cd799439017',
  userId: '507f1f77bcf86cd799439011',
  type: 'ride_request',
  message: 'New ride request received',
  rideId: '507f1f77bcf86cd799439012',
  relatedUserId: '507f1f77bcf86cd799439014',
  read: false,
  createdAt: new Date('2024-01-01')
};
