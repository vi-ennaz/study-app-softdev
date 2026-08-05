// Authentication screen
// Overview: 


// imports react and usestate which allows to create and update variables 
// that stores info while app is running
import React, { useState } from 'react';

// imports different react native components that are used to create the layout,
// buttons, text fields and other elements on the auth page 
import {
View, Text, TextInput, TouchableOpacity, StyleSheet,
KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';

// allow the app to display correctly on different devices by preventing
// overlap with other areas 
import { SafeAreaView } from 'react-native-safe-area-context';

// imports supabase client for authentication services 
import { supabase } from '../lib/supabase';

// controls login, signup and password reset screens 
// recieves auth after successful login
export default function AuthScreen({ onAuth }) {

  // stores current authentication mode
  // "login" = existing user login, "signup" = create new acc, "forget" = reset
  // password 
  const [mode, setMode] = useState('login');  

  // store's user email input
  const [email, setEmail] = useState('');

  // store's user password input 
  const [password, setPassword] = useState('');

  // stores error messages displayed to the user
  const [error, setError] = useState('');

  // stores successful action messages
  const [msg, setMsg] = useState('');

  // controls loading screen while communicating with Supabase
  // and also revents multiple authentication requests
  const [loading, setLoading] = useState(false);

  // controls whether password is visible or hidden
  const [showPass, setShowPass] = useState(false);


  // clears previous error and success messages, used when switching screens or changing user input
  const reset = () => { setError(''); setMsg(''); };


  // validates the user's input before sending data to the Supabase
  const validate = () => {

  // checks if email contains basic email formatting
    if (!email.includes('@') || !email.includes('.')) {
      setError('Enter a valid email address.'); return false;
    }

    // password validation is skipped on forgot password screen
    // and requires passwords to contain at least 6 characters
    if (mode !== 'forgot' && password.length < 6) {
      setError('Password must be at least 6 characters.'); 
      return false;
    }

    // returns true if all validation checks pass
    return true;
  };

  // logs an existing user into their account
const handleLogin = async () => {

  // stops the login process if the input is invalid
  if (!validate()) return;

  // shows loading and removes old messages
  setLoading(true); reset();

  // sends the user's email and password to Supabase to check if acc exists
    const { error } = await supabase.auth.signInWithPassword({ email, password });
   
  // stops the loading animation after receiving a response
    setLoading(false);
  
  // displays an error if the login details are wrong
    if (error) { setError(error.message); return; }


// runs the authentication function to allow the user to access the main
// application 
    onAuth();
  };

// creates a new user acc using email and password, input by user
  const handleSignup = async () => {

// stops the signup process if the input is invalid 
    if (!validate()) return;

// shows the loading indicator and clears previous/old msgs 
    setLoading(true); reset();

// sends the signup request to Supabase 
    const { error } = await supabase.auth.signUp({ email, password });

// hides the loading indicator once recieved response 
    setLoading(false);
// displays an error message if signup fails
    if (error) { setError(error.message); return; }
// tells the user to verify their email before they log in
    setMsg('Check your email for a confirmation link, then log in.');
{/* returns user to login screen */}
    setMode('login');
  };

{/* sends a password reset email to user */}
  const handleForgot = async () => {
// checks that user has entered an email address 
    if (!email.includes('@')) { setError('Enter your email first.'); return; }
// displays the loading indicator and clears old msgs 
    setLoading(true); reset();
{/* requests a password reset email from Supabase */}
    const { error } = await supabase.auth.resetPasswordForEmail(email);
{/* stops displaying the loading indicator */}
    setLoading(false);
{/* displays error message if the request fails */}
    if (error) { setError(error.message); return; }
{/* informs user that the reset email has been sent */}
    setMsg('Password reset email sent - check your inbox.');
  };

{/* returns the auth screen interface */}
  return (
 // keeps the interface within the device's safe display area
    <SafeAreaView style={styles.safe}>

{/* moves the screen when the keyboard appears so that text remain visible */}
      <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      >

{/* allows the page to scroll if the keyboard covers anything */}
    <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        >
{/* displays the logo on top of the screen */}
        <View style={styles.logoWrap}>
       <View style={styles.logoPlaceholder}>
        <Text style={styles.logoText}>vv</Text>
        </View>
        </View>

{/* displays a different heading depending on the current authentication mode */}
        <Text style={styles.heading}>
        {mode === 'login'  ? 'Welcome back.'       :
mode === 'signup' ? 'Create your account.' :
'Reset password.'}
</Text>

{/* displays a brief description to guide the user through the current action */}
<Text style={styles.subheading}>
{mode === 'login'  ? 'Log in to your vv account'   :
mode === 'signup' ? 'Start your study journey'     :
 "We'll send you a reset link"}
 </Text>

{/* displays the label for the email input */}
  <Text style={styles.label}>Email</Text>
{/* allows the user to enter email address */}
{/* updates email as the user types and clears old msgs */}
  <TextInput
  style={styles.input}
  placeholder="your@email.com"
  placeholderTextColor="#555"
  value={email}
  onChangeText={t => { setEmail(t); reset(); }}
  autoCapitalize="none"
  keyboardType="email-address"
  autoFocus
  />
   {/*only displays the password field when the user logs in or creating an acc */}
          {mode !== 'forgot' && (
            <>
          {/* displays the password input label */}
              <Text style={styles.label}>Password</Text>
          {/* groups the password field & show/hide button */}
              <View style={styles.passWrap}>
                <TextInput
          // allows the user to enter password
                  style={styles.passInput}
                  placeholder="at least 6 characters"
                  placeholderTextColor="#555"
                  value={password}
          // updates password as the user types & clears old msgs
                  onChangeText={t => { setPassword(t); reset(); }}
          // hides/reveals the password text
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                />
        {/* toggles whether password is visible*/}
                <TouchableOpacity onPress={() => setShowPass(v => !v)} style={styles.eyeBtn}>
                 <Text style={styles.eyeTxt}>
                 {showPass ? 'Hide' : 'Show'}
                 </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          
          {/* displays error message when auth fails */}

          {error ? <Text style={styles.error}>{error}</Text> : null}
          
          {/* displays success message after completing an action */}
          {msg ? <Text style={styles.success}>{msg}</Text> : null}
    {/* main authentication button performs login, signup or password reset depends on current screen */}
          <TouchableOpacity
            style={styles.mainBtn}
            onPress={mode === 'login' ? handleLogin : mode === 'signup' ? handleSignup : handleForgot}
            disabled={loading}
          >
            {/* displays a loading spinner while waiting for Supabase */}
            {loading
              ? <ActivityIndicator color="#fff" />
              // displays the appropriate button text
              : <Text style={styles.mainBtnTxt}>
              {/* only displayed on the login screen which allows users to reset their password */}
                  {mode === 'login'  ? 'Log in':
                   mode === 'signup' ? 'Create account':
                     'Send reset link'}
                </Text>
            }
          </TouchableOpacity>

          {mode === 'login' && (
          // displays either the signup/login switch or the return button from the reset password pag
            <TouchableOpacity onPress={() => { setMode('forgot'); reset(); }} style={styles.forgotBtn}>
              <Text style={styles.forgotTxt}>Forgot password?</Text>
            </TouchableOpacity>
          )}

          {mode !== 'forgot' ? (
            <View style={styles.switchRow}>
          {/* explanatory text shown before the switch button */}
              <Text style={styles.switchText}>
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              </Text>
          {/* switches between the login & signup screens */}
              <TouchableOpacity onPress={() => { setMode(mode === 'login' ? 'signup' : 'login'); reset(); }}>
                <Text style={styles.switchLink}>
                  {mode === 'login' ? 'Sign up' : 'Log in'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (

            // returns user to login screen
            <TouchableOpacity onPress={() => { setMode('login'); reset(); }} style={styles.forgotBtn}>
              <Text style={styles.switchLink}>← back to login</Text>
            </TouchableOpacity>
          )}
{/* displays application's screen legal notice */}
          <Text style={styles.legal}>
            By continuing you agree to our{' '}
            <Text style={styles.legalLink}>Terms</Text>
            {' '}and{' '}
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </Text>

{/* displays the application copyright */}
          <Text style={styles.copyright}>© 2026 vv</Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

{/* defines all styles used by the auth screen */}
const styles = StyleSheet.create({
  // styles the safe area container
  safe: { flex: 1, backgroundColor: '#0a0a0a' },
  // styles the scrollable content container
  content: { paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40, alignItems: 'center' },

  // positions the logo area 
  logoWrap: { marginBottom: 32 },
  // styles the temporary logo placeholder
  logoPlaceholder: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#1a1a1a', borderWidth: 1.5, borderColor: '#333', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 22, fontWeight: '700', color: '#fff', letterSpacing: -1 },
  // styles the logo image when use
  logo: { width: 64, height: 64, borderRadius: 16 },

  // styles the main heading
  heading: { fontSize: 26, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 6 },
  // styles the subheading text
  subheading: { fontSize: 15, color: '#888', textAlign: 'center', marginBottom: 32 },

  // styles labels above text 
  label: { fontSize: 13, color: '#aaa', alignSelf: 'flex-start', marginBottom: 6, marginTop: 4 },
  // styles the email input field
  input: {
    width: '100%', backgroundColor: '#111', borderWidth: 1.5, borderColor: '#2a2a2a',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14,
    color: '#fff', fontSize: 15, marginBottom: 14,
  },
  // styles the password input container
  passWrap: { width: '100%', flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderWidth: 1.5, borderColor: '#2a2a2a', borderRadius: 10, marginBottom: 14 },
 // styles the password text input
  passInput: {flex: 1, paddingHorizontal: 14, paddingVertical: 14, color: '#fff', fontSize: 15 },
  // styles the show/hide password button
  eyeBtn: { paddingHorizontal: 14 },
 // styles the show/hide password text
  eyeTxt: { fontSize: 16 },

  // styles error messages
  error: { fontSize: 13, color: '#ef4444', alignSelf: 'flex-start', marginBottom: 10 },
  // styles success messages
  success: { fontSize: 13, color: '#22c55e', alignSelf: 'flex-start', marginBottom: 10 },

  // styles the main authentication button
  mainBtn: { width: '100%', backgroundColor: '#3B82F6', borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginBottom: 14, marginTop: 4 },
  // styles the button text
  mainBtnTxt: { fontSize: 16, color: '#fff', fontWeight: '600' },

  // styles the forgot password button
  forgotBtn: { marginBottom: 20 },
  // styles the forgot password text
  forgotTxt: { fontSize: 13, color: '#888', textDecorationLine: 'underline' },

  // styles the login/signup switch container
  switchRow: { flexDirection: 'row', marginBottom: 32 },
 // styles the switch description text
  switchText:{ fontSize: 14, color: '#666' },
 // styles the switch button text
  switchLink:{ fontSize: 14, color: '#fff', textDecorationLine: 'underline' },
// styles the legal disclaimer
  legal: { fontSize: 11, color: '#444', textAlign: 'center', lineHeight: 17, marginBottom: 12 },
 // styles links within the legal disclaimer
  legalLink: { color: '#666', textDecorationLine: 'underline' },
 // styles the copyright text
  copyright: { fontSize: 11, color: '#333' },
});