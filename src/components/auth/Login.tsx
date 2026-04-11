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

const LoginWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%2382ACFF' fill-opacity='0.07' fill-rule='evenodd'/%3E%3C/svg%3E");
  
  @media (max-width: 480px) {
    padding: 15px;
    align-items: flex-start;
    padding-top: 50px;
  }
`;

const LoginButton = styled(AquaButton)`
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

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
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
    setSuccess(null);
    setShowResend(false);
    setIsLoading(true);

    try {
      console.log('Attempting to sign in with:', formData.email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      console.log('Sign in response:', { data, error });

      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          setShowResend(true);
        }
        throw error;
      }

      if (data.user) {
        console.log('Login successful with user:', data.user);
        setSuccess('Login successful!');
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/profile');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
      });
      if (error) throw error;
      setSuccess('Verification email resent! Please check your inbox.');
      setShowResend(false);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginWrapper>
      <FormContainer style={{ width: '400px', maxWidth: '100%' }}>
        <WindowTitleBar>
          <WindowButtons>
            <WindowButton color="#FF5F57" />
            <WindowButton color="#FFBD2E" />
            <WindowButton color="#28C840" />
          </WindowButtons>
          <WindowTitle>Login</WindowTitle>
        </WindowTitleBar>
        <WindowContent>
          <FormTitle>Welcome Back</FormTitle>
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
            {error && <ErrorMessage>{error}</ErrorMessage>}
            {success && <SuccessMessage>{success}</SuccessMessage>}
            
            {showResend && (
              <div style={{ marginBottom: '15px', textAlign: 'center' }}>
                <Link to="#" onClick={(e) => { e.preventDefault(); handleResend(); }} style={{ fontSize: '13px', color: 'var(--accent)' }}>
                  Didn't get the email? Resend verification
                </Link>
              </div>
            )}

            <LoginButton type="submit" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </LoginButton>
            <FormFooter>
              Don't have an account? <Link to="/register">Register</Link>
            </FormFooter>
          </form>
        </WindowContent>
      </FormContainer>
    </LoginWrapper>
  );
};

export default Login; 