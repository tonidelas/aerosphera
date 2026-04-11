import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import {
  FormContainer,
  FormTitle,
  FormGroup,
  FormLabel,
  GlassInput,
  AquaButton,
  ErrorMessage,
  SuccessMessage,
  WindowButtons,
  WindowButton,
  WindowTitleBar,
  WindowTitle,
  WindowContent
} from '../common/StyledComponents';
import styled from 'styled-components';

const RegisterWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%2382ACFF' fill-opacity='0.07' fill-rule='evenodd'/%3E%3C/svg%3E");
  
  @media (max-width: 480px) {
    padding: 15px;
    align-items: flex-start;
    padding-top: 30px;
  }
`;

const RegisterButton = styled(AquaButton)`
  width: 100%;
  margin-top: 20px;
  padding: 10px;
  font-size: 16px;
  
  @media (max-width: 480px) {
    padding: 8px;
    font-size: 15px;
  }
`;

const FormFooter = styled.div`
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
  color: var(--text);
  
  a {
    color: var(--accent);
    font-weight: bold;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Attempting to sign up with:', formData.email);
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            email: formData.email,
          }
        }
      });

      console.log('Sign up response:', { data, error });

      if (error) throw error;

      if (data.user) {
        console.log('User created successfully:', data.user);
        
        // Check if email confirmation is required
        // Supabase behavior: if confirmation is required, session is null
        if (data.session) {
          // No confirmation required, log them in
          localStorage.setItem('user', JSON.stringify(data.user));
          navigate('/profile');
        } else {
          // Confirmation required
          setIsEmailSent(true);
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <RegisterWrapper>
        <FormContainer style={{ width: '450px', maxWidth: '100%', textAlign: 'center' }}>
          <WindowTitleBar>
            <WindowButtons>
              <WindowButton color="#FF5F57" />
              <WindowButton color="#FFBD2E" />
              <WindowButton color="#28C840" />
            </WindowButtons>
            <WindowTitle>Verification Required</WindowTitle>
          </WindowTitleBar>
          <WindowContent style={{ padding: '40px 30px' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>✉️</div>
            <FormTitle style={{ fontSize: '24px', marginBottom: '16px' }}>Check your email</FormTitle>
            <p style={{ color: '#555', lineHeight: '1.6', marginBottom: '24px' }}>
              We've sent a verification link to <strong>{formData.email}</strong>.<br />
              Please click the link in the email to activate your account.
            </p>
            <div style={{ background: 'rgba(13, 158, 255, 0.05)', padding: '18px', borderRadius: '12px', border: '1px solid rgba(13, 158, 255, 0.1)', marginBottom: '30px', textAlign: 'left', fontSize: '14.5px' }}>
              <strong style={{ color: 'var(--accent)', display: 'block', marginBottom: '8px' }}>Important Instructions:</strong>
              <ul style={{ margin: '0', paddingLeft: '20px', color: '#444' }}>
                <li style={{ marginBottom: '8px' }}>The email will come from <strong>Supabase Auth</strong>.</li>
                <li style={{ marginBottom: '8px' }}>Once you click the link, it may open a blank page—this is normal!</li>
                <li>Your account is then <strong>confirmed</strong>, and you can return here to <strong>retry your login</strong>.</li>
              </ul>
            </div>
            <AquaButton onClick={() => navigate('/login')} style={{ width: '100%' }}>
              Back to Login
            </AquaButton>
          </WindowContent>
        </FormContainer>
      </RegisterWrapper>
    );
  }

  return (
    <RegisterWrapper>
      <FormContainer style={{ width: '400px', maxWidth: '100%' }}>
        <WindowTitleBar>
          <WindowButtons>
            <WindowButton color="#FF5F57" />
            <WindowButton color="#FFBD2E" />
            <WindowButton color="#28C840" />
          </WindowButtons>
          <WindowTitle>Register</WindowTitle>
        </WindowTitleBar>
        <WindowContent>
          <FormTitle>Create Account</FormTitle>
          <form onSubmit={handleSubmit}>
            <FormGroup>
              <FormLabel>Email</FormLabel>
              <GlassInput
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
              />
            </FormGroup>
            <FormGroup>
              <FormLabel>Password</FormLabel>
              <GlassInput
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
              />
            </FormGroup>
            <FormGroup>
              <FormLabel>Confirm Password</FormLabel>
              <GlassInput
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="••••••••"
              />
            </FormGroup>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <RegisterButton type="submit" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Register'}
            </RegisterButton>
            <FormFooter>
              Already have an account? <Link to="/login">Login</Link>
            </FormFooter>
          </form>
        </WindowContent>
      </FormContainer>
    </RegisterWrapper>
  );
};

export default Register; 