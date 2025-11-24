/**
 * ADVANCED PAYPAL CHECKOUT
 * Direct credit/debit card payments WITHOUT requiring PayPal login
 * 
 * Features:
 * - Native card input fields
 * - No "Login to PayPal" requirement
 * - Optional PayPal button for users who want it
 * - Beautiful custom UI
 * 
 * EXPO SDK 52 Compatible
 */

import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

const Colors = {
  primary: '#D4E700',
  purple: '#5d1289ff',
  black: '#000000',
  white: '#FFFFFF',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  success: '#10B981',
  error: '#EF4444',
};

interface AdvancedPayPalCheckoutProps {
  visible: boolean;
  amount: number;
  currency?: string;
  description: string;
  onSuccess: (orderId: string, payerId: string, details: any) => void;
  onCancel: () => void;
  onError: (error: Error) => void;
  metadata?: any;
}

export function AdvancedPayPalCheckout({
  visible,
  amount,
  currency = 'USD',
  description,
  onSuccess,
  onCancel,
  onError,
  metadata,
}: AdvancedPayPalCheckoutProps) {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  // Get PayPal client ID from environment
  const clientId = process.env.EXPO_PUBLIC_PAYPAL_CLIENT_ID || '';
  const mode = process.env.EXPO_PUBLIC_PAYPAL_MODE || 'sandbox';

  if (!clientId) {
    console.error('❌ PayPal Client ID not configured');
  }

  // Generate advanced HTML with card fields
  const generateHTML = () => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script src="https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&components=buttons,card-fields&enable-funding=card&disable-funding=paylater"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 30px;
            max-width: 500px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 48px;
            margin-bottom: 10px;
        }
        h1 {
            font-size: 24px;
            color: #1a1a1a;
            margin-bottom: 10px;
        }
        .amount {
            font-size: 36px;
            font-weight: bold;
            color: #667eea;
            margin: 20px 0;
        }
        .description {
            color: #666;
            font-size: 14px;
            margin-bottom: 30px;
        }
        
        /* Tab Switcher */
        .payment-tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 24px;
            border-bottom: 2px solid #f3f4f6;
        }
        .tab {
            flex: 1;
            padding: 12px;
            background: transparent;
            border: none;
            border-bottom: 3px solid transparent;
            cursor: pointer;
            font-size: 15px;
            font-weight: 600;
            color: #6b7280;
            transition: all 0.3s;
        }
        .tab.active {
            color: #667eea;
            border-bottom-color: #667eea;
        }
        .tab-content {
            display: none;
        }
        .tab-content.active {
            display: block;
        }
        
        /* Card Form Styles */
        .form-group {
            margin-bottom: 20px;
        }
        .form-label {
            display: block;
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 8px;
        }
        .hosted-field {
            height: 48px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 0 16px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        .hosted-field.braintree-hosted-fields-focused {
            border-color: #667eea;
            outline: none;
        }
        .hosted-field.braintree-hosted-fields-invalid {
            border-color: #ef4444;
        }
        .row {
            display: flex;
            gap: 12px;
        }
        .row .form-group {
            flex: 1;
        }
        
        /* Pay Button */
        .pay-button {
            width: 100%;
            padding: 16px;
            background: #000;
            color: white;
            border: none;
            border-radius: 30px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        .pay-button:hover {
            background: #1a1a1a;
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.2);
        }
        .pay-button:disabled {
            background: #d1d5db;
            cursor: not-allowed;
            transform: none;
        }
        
        /* PayPal Button Container */
        #paypal-button-container {
            margin-top: 20px;
        }
        
        /* Card Icons */
        .card-icons {
            display: flex;
            gap: 8px;
            align-items: center;
            margin-top: 8px;
        }
        .card-icon {
            width: 40px;
            height: 26px;
            background: #f3f4f6;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: 600;
            color: #6b7280;
        }
        
        /* Loading Spinner */
        .loading {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Security Badge */
        .secure-badge {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            color: #10B981;
            font-size: 12px;
            margin-top: 20px;
            padding: 10px;
            background: #F0FDF4;
            border-radius: 8px;
        }
        
        /* Mode Badge */
        .mode-badge {
            position: absolute;
            top: 10px;
            right: 10px;
            background: #FEF3C7;
            color: #92400E;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        /* Error Message */
        .error-message {
            background: #fee2e2;
            color: #dc2626;
            padding: 12px;
            border-radius: 8px;
            margin-top: 12px;
            font-size: 14px;
            display: none;
        }
        .error-message.show {
            display: block;
        }
    </style>
</head>
<body>
    ${mode === 'sandbox' ? '<div class="mode-badge">⚠️ Test Mode</div>' : ''}
    <div class="container">
        <div class="header">
            <div class="logo">🚗</div>
            <h1>Drift Carpool Payment</h1>
            <div class="amount">${currency} $${amount.toFixed(2)}</div>
            <div class="description">${description}</div>
        </div>
        
        <!-- Payment Method Tabs -->
        <div class="payment-tabs">
            <button class="tab active" onclick="switchTab('card')">
                💳 Card
            </button>
            <button class="tab" onclick="switchTab('paypal')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 00-.794.68l-.04.22-.63 3.993-.028.15a.805.805 0 01-.794.68H7.72a.483.483 0 01-.477-.558L8.926 12.7l.05-.273a.805.805 0 01.794-.68h1.643c3.48 0 6.2-1.414 6.997-5.502.11-.56.195-1.077.228-1.551a4.7 4.7 0 01.43.784z"/>
                </svg>
                PayPal
            </button>
        </div>
        
        <!-- Card Payment Tab -->
        <div id="card-tab" class="tab-content active">
            <div class="loading" id="card-loading">
                <div class="spinner"></div>
                <p>Loading secure payment form...</p>
            </div>
            
            <div id="card-form" style="display: none;">
                <div class="form-group">
                    <label class="form-label">Card Number</label>
                    <div id="card-number" class="hosted-field"></div>
                    <div class="card-icons">
                        <div class="card-icon">VISA</div>
                        <div class="card-icon">MC</div>
                        <div class="card-icon">AMEX</div>
                        <div class="card-icon">DISC</div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Cardholder Name</label>
                    <div id="card-name" class="hosted-field"></div>
                </div>
                
                <div class="row">
                    <div class="form-group">
                        <label class="form-label">Expiry Date</label>
                        <div id="expiration-date" class="hosted-field"></div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">CVV</label>
                        <div id="cvv" class="hosted-field"></div>
                    </div>
                </div>
                
                <div class="error-message" id="card-errors"></div>
                
                <button id="card-submit" class="pay-button">
                    <span>Pay $${amount.toFixed(2)}</span>
                    <span>→</span>
                </button>
            </div>
        </div>
        
        <!-- PayPal Tab -->
        <div id="paypal-tab" class="tab-content">
            <div class="loading" id="paypal-loading">
                <div class="spinner"></div>
                <p>Loading PayPal...</p>
            </div>
            <div id="paypal-button-container"></div>
        </div>

        <div class="secure-badge">
            <span>🔒</span>
            <span>Secure payment powered by PayPal</span>
        </div>
    </div>

    <script>
        // Ensure window.ReactNativeWebView exists
        window.ReactNativeWebView = window.ReactNativeWebView || {
            postMessage: function(message) {
                console.log('Mock postMessage:', message);
            }
        };

        let orderId = null;
        let hostedFieldsInstance = null;

        // Tab switcher
        function switchTab(tab) {
            // Update tab buttons
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            event.target.closest('.tab').classList.add('active');
            
            // Update tab content
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(tab + '-tab').classList.add('active');
        }

        // Initialize Card Fields with direct card entry
        if (paypal.CardFields) {
            const cardField = paypal.CardFields({
                createOrder: function(data) {
                    // Create order via our Firebase Function
                    return paypal.Order.create({
                        purchase_units: [{
                            amount: {
                                value: '${amount.toFixed(2)}',
                                currency_code: '${currency}'
                            },
                            description: '${description.replace(/'/g, "\\'")}'
                        }],
                        application_context: {
                            shipping_preference: 'NO_SHIPPING',
                            user_action: 'PAY_NOW',
                            brand_name: 'Drift Carpool'
                        }
                    });
                },
                onApprove: function(data) {
                    // Card payment approved, capture it
                    return paypal.Order.capture(data.orderID).then(function(details) {
                        console.log('Card payment successful:', details);
                        
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'PAYMENT_SUCCESS',
                            orderId: data.orderID,
                            payerId: details.payer.payer_id || 'card-payment',
                            details: details
                        }));
                    });
                },
                onError: function(err) {
                    console.error('Card payment error:', err);
                    showError(err.message || 'Payment failed. Please try again.');
                },
                style: {
                    input: {
                        'font-size': '16px',
                        'font-family': '-apple-system, BlinkMacSystemFont, sans-serif',
                        'color': '#1a1a1a'
                    }
                }
            });

            // Check if card fields are eligible
            if (cardField.isEligible()) {
                // Render card number field
                cardField.NumberField({
                    placeholder: '4111 1111 1111 1111'
                }).render('#card-number').then(function() {
                    console.log('Card number field rendered');
                });

                // Render expiry field
                cardField.ExpiryField({
                    placeholder: 'MM/YY'
                }).render('#expiration-date').then(function() {
                    console.log('Expiry field rendered');
                });

                // Render CVV field
                cardField.CVVField({
                    placeholder: '123'
                }).render('#cvv').then(function() {
                    console.log('CVV field rendered');
                });

                // Render name field
                cardField.NameField({
                    placeholder: 'John Doe'
                }).render('#card-name').then(function() {
                    console.log('Name field rendered');
                    
                    // All fields rendered, show form
                    document.getElementById('card-loading').style.display = 'none';
                    document.getElementById('card-form').style.display = 'block';
                });

                // Handle submit button
                document.getElementById('card-submit').addEventListener('click', function() {
                    const submitButton = document.getElementById('card-submit');
                    submitButton.disabled = true;
                    submitButton.innerHTML = '<div class="spinner" style="width: 20px; height: 20px; border-width: 2px; margin: 0 auto;"></div>';

                    cardField.submit().then(function() {
                        // Payment will be handled by onApprove callback
                    }).catch(function(err) {
                        console.error('Submit error:', err);
                        submitButton.disabled = false;
                        submitButton.innerHTML = '<span>Pay $${amount.toFixed(2)}</span><span>→</span>';
                        showError(err.message || 'Payment failed');
                    });
                });
            } else {
                console.log('Card fields not eligible, showing PayPal button only');
                document.getElementById('card-loading').innerHTML = '<p>Card payments not available. Please use PayPal button.</p>';
            }
        } else {
            console.log('CardFields not available');
            document.getElementById('card-loading').innerHTML = '<p>Please use PayPal button to complete payment.</p>';
        }

        // Initialize PayPal Buttons
        paypal.Buttons({
            createOrder: function(data, actions) {
                document.getElementById('paypal-loading').style.display = 'none';
                
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: '${amount.toFixed(2)}',
                            currency_code: '${currency}'
                        },
                        description: '${description.replace(/'/g, "\\'")}'
                    }],
                    application_context: {
                        shipping_preference: 'NO_SHIPPING',
                        user_action: 'PAY_NOW',
                        brand_name: 'Drift Carpool'
                    }
                });
            },
            onApprove: function(data, actions) {
                return actions.order.capture().then(function(details) {
                    console.log('PayPal payment captured:', details);
                    
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'PAYMENT_SUCCESS',
                        orderId: data.orderID,
                        payerId: data.payerID,
                        details: details
                    }));
                });
            },
            onCancel: function(data) {
                console.log('Payment cancelled:', data);
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'PAYMENT_CANCELLED',
                    orderId: data.orderID
                }));
            },
            onError: function(err) {
                console.error('PayPal error:', err);
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'PAYMENT_ERROR',
                    error: err.toString()
                }));
            }
        }).render('#paypal-button-container');

        // Show error message
        function showError(message) {
            const errorDiv = document.getElementById('card-errors');
            errorDiv.textContent = message;
            errorDiv.classList.add('show');
            setTimeout(() => errorDiv.classList.remove('show'), 5000);
        }
    </script>
</body>
</html>
    `;
  };

  const handleMessage = async (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      console.log('📨 PayPal WebView Message:', data.type);

      switch (data.type) {
        case 'PAYMENT_SUCCESS':
          console.log('✅ Payment successful:', data.orderId);
          onSuccess(data.orderId, data.payerId, data.details);
          break;

        case 'PAYMENT_CANCELLED':
          console.log('❌ Payment cancelled');
          onCancel();
          break;

        case 'PAYMENT_ERROR':
          console.error('❌ Payment error:', data.error);
          onError(new Error(data.error));
          break;

        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('❌ Error handling PayPal message:', error);
      onError(error as Error);
    }
  };

  const handleClose = () => {
    Alert.alert(
      'Cancel Payment',
      'Are you sure you want to cancel this payment?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', style: 'destructive', onPress: onCancel },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={28} color={Colors.gray[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Secure Checkout</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* WebView */}
        <WebView
          ref={webViewRef}
          source={{ html: generateHTML() }}
          style={styles.webView}
          onMessage={handleMessage}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          scalesPageToFit
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.purple} />
              <Text style={styles.loadingText}>Loading secure checkout...</Text>
            </View>
          )}
        />

        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.purple} />
            <Text style={styles.loadingText}>Initializing payment...</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },
  headerSpacer: {
    width: 40,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white + 'E6',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.gray[600],
  },
});