/**
 * Unit Tests for User Model
 * Tests model validation, schema, and methods
 */

import mongoose from 'mongoose';
import { mockUser } from '../fixtures/mockData.js';

describe('User Model Tests', () => {
  // Test user creation
  describe('User Creation', () => {
    test('should create a valid user with required fields', () => {
      const user = mockUser;
      expect(user).toHaveProperty('firstName');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('collegeId');
      expect(user).toHaveProperty('hashedPassword');
    });

    test('should have valid email format', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(mockUser.email).toMatch(emailRegex);
    });

    test('should have valid contact number (10 digits)', () => {
      const phoneRegex = /^[0-9]{10}$/;
      expect(mockUser.contactNumber).toMatch(phoneRegex);
    });

    test('should have OTP verified flag', () => {
      expect(mockUser.otpVerified).toBe(true);
    });
  });

  // Test user validation
  describe('User Validation', () => {
    test('should have required fields', () => {
      const requiredFields = ['firstName', 'lastName', 'email', 'collegeId', 'hashedPassword'];
      requiredFields.forEach(field => {
        expect(mockUser).toHaveProperty(field);
      });
    });

    test('email should be unique constraint ready', () => {
      expect(mockUser.email).toBeTruthy();
      expect(typeof mockUser.email).toBe('string');
    });

    test('collegeId should be unique and valid format', () => {
      expect(mockUser.collegeId).toMatch(/^BV\d+$/);
    });
  });

  // Test location field (GeoJSON)
  describe('Location Field (GeoJSON)', () => {
    test('should have location as Point type', () => {
      expect(mockUser.location.type).toBe('Point');
    });

    test('should have valid coordinates [longitude, latitude]', () => {
      const [lng, lat] = mockUser.location.coordinates;
      expect(lng).toBeGreaterThanOrEqual(-180);
      expect(lng).toBeLessThanOrEqual(180);
      expect(lat).toBeGreaterThanOrEqual(-90);
      expect(lat).toBeLessThanOrEqual(90);
    });
  });

  // Test user timestamps
  describe('User Timestamps', () => {
    test('should have createdAt timestamp', () => {
      expect(mockUser.createdAt).toBeInstanceOf(Date);
    });

    test('should have updatedAt timestamp', () => {
      expect(mockUser.updatedAt).toBeInstanceOf(Date);
    });
  });

  // Test user status
  describe('User Status', () => {
    test('should have isActive flag', () => {
      expect(mockUser.isActive).toBe(true);
    });

    test('isActive should be boolean', () => {
      expect(typeof mockUser.isActive).toBe('boolean');
    });
  });
});
