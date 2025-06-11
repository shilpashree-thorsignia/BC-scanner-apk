import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, Switch, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { getEmailConfig, createEmailConfig, updateEmailConfig, testEmailConfig, EmailConfig, CreateEmailConfigData } from '../lib/api';

interface ConfigItemProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  showHelpIcon?: boolean;
  onHelpPress?: () => void;
}

const ConfigItem: React.FC<ConfigItemProps> = ({ title, description, children, showHelpIcon, onHelpPress }) => {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.configItem, { backgroundColor: colors.listItemBackground }]}>
      <View style={styles.configItemHeader}>
        <View style={styles.titleRow}>
          <Text style={[styles.configItemTitle, { color: colors.text }]}>{title}</Text>
          {showHelpIcon && (
            <TouchableOpacity onPress={onHelpPress} style={styles.helpIcon}>
              <Ionicons name="help-circle-outline" size={20} color={colors.accent} />
            </TouchableOpacity>
          )}
        </View>
        {description && (
          <Text style={[styles.configItemDescription, { color: colors.secondaryText }]}>
            {description}
          </Text>
        )}
      </View>
      {children}
    </View>
  );
};

export default function AutoMailConfigScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  
  // State for email configuration
  const [isEnabled, setIsEnabled] = useState(false);
  const [senderEmail, setSenderEmail] = useState('');
  const [senderPassword, setSenderPassword] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [emailSubject, setEmailSubject] = useState('New Business Card Scanned');
  const [emailTemplate, setEmailTemplate] = useState('A new business card has been scanned and added to your collection.');
  const [configId, setConfigId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Load existing configuration on mount
  useEffect(() => {
    loadEmailConfig();
  }, []);

  const loadEmailConfig = async () => {
    try {
      setIsLoading(true);
      const config = await getEmailConfig();
      
      if (config) {
        setConfigId(config.id);
        setIsEnabled(config.is_enabled);
        setSenderEmail(config.sender_email);
        
        // Only clear password if no password is saved
        // If password is saved, show masked version as placeholder
        if (config.sender_password_saved) {
          setSenderPassword(config.sender_password_masked || '••••••••••••••••');
        } else {
          setSenderPassword('');
        }
        
        setRecipientEmail(config.recipient_email);
        setSmtpHost(config.smtp_host);
        setSmtpPort(config.smtp_port);
        setEmailSubject(config.email_subject);
        setEmailTemplate(config.email_template);
      }
    } catch (error) {
      console.error('Error loading email configuration:', error);
      // Don't show error alert as config might not exist yet
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleSaveConfiguration = async () => {
    try {
      setIsSaving(true);
      
      if (isEnabled) {
        // Validate required fields
        const isMaskedPassword = senderPassword === '••••••••••••••••' || senderPassword.includes('•');
        
        if (!senderEmail || (!senderPassword && !isMaskedPassword) || !recipientEmail) {
          Alert.alert('Missing Information', 'Please fill in all required fields.');
          return;
        }
      }
      
      // Check if password is masked (not changed by user)
      const isMaskedPassword = senderPassword === '••••••••••••••••' || senderPassword.includes('•');
      
      const configData: CreateEmailConfigData | Partial<CreateEmailConfigData> = {
        is_enabled: isEnabled,
        sender_email: senderEmail,
        recipient_email: recipientEmail,
        smtp_host: smtpHost,
        smtp_port: smtpPort,
        email_subject: emailSubject,
        email_template: emailTemplate,
      };

      // Only include password if it's not masked (user changed it)
      if (!isMaskedPassword || !configId) {
        configData.sender_password = senderPassword;
      }

      let savedConfig: EmailConfig;
      
      if (configId) {
        // Update existing configuration
        savedConfig = await updateEmailConfig(configId, configData as CreateEmailConfigData);
      } else {
        // Create new configuration
        savedConfig = await createEmailConfig(configData as CreateEmailConfigData);
        setConfigId(savedConfig.id);
      }
      
      Alert.alert('Success', 'Email configuration saved successfully!');
      
      // Reload config to show masked password
      await loadEmailConfig();
      
    } catch (error) {
      console.error('Error saving email configuration:', error);
      Alert.alert('Error', 'Failed to save email configuration. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!isEnabled) {
      Alert.alert('Email Disabled', 'Please enable automated emails first.');
      return;
    }
    
    if (!senderEmail || !senderPassword || !recipientEmail) {
      Alert.alert('Missing Information', 'Please fill in all required fields before testing.');
      return;
    }

    if (!configId) {
      Alert.alert('Save First', 'Please save the configuration before testing.');
      return;
    }
    
    try {
      setIsTesting(true);
      const result = await testEmailConfig(configId);
      
      if (result.success) {
        Alert.alert('Test Successful', result.message || 'Test email sent successfully!');
      } else {
        Alert.alert('Test Failed', result.message || 'Failed to send test email.');
      }
    } catch (error) {
      console.error('Error testing email configuration:', error);
      Alert.alert('Test Failed', 'Failed to send test email. Please check your configuration.');
    } finally {
      setIsTesting(false);
    }
  };

  const showSenderEmailHelp = () => {
    const helpText = 'Sender Email Setup:\n\n1. Use a Gmail account or other SMTP-supported email\n2. For Gmail: Enable 2-factor authentication\n3. Generate an app-specific password\n4. Use the app password instead of your regular password\n\nNote: This email will be used to send automated notifications.';
    
    Alert.alert('Sender Email Help', helpText);
  };

  const showSenderPasswordHelp = () => {
    const helpText = 'Email Password:\n\nFor Gmail:\n1. Go to Google Account settings\n2. Enable 2-factor authentication\n3. Go to App passwords\n4. Generate a new app password\n5. Use this app password here\n\nFor other providers:\nUse your regular email password or app-specific password as required by your email provider.';
    
    Alert.alert('Email Password Help', helpText);
  };

  const showSmtpHelp = () => {
    const helpText = 'SMTP Settings:\n\nCommon SMTP configurations:\n\n• Gmail: smtp.gmail.com:587\n• Outlook: smtp-mail.outlook.com:587\n• Yahoo: smtp.mail.yahoo.com:587\n• Custom: Contact your email provider\n\nMost providers use port 587 for TLS encryption.';
    
    Alert.alert('SMTP Configuration', helpText);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: 'card'
        }}
      />
      
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.headerBackground }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={24} color={colors.icon} />
            <Text style={[styles.headerTitle, { color: colors.text }]}>Automated Mail Config</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.text }]}>Loading configuration...</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <ConfigItem 
              title="Enable Automated Emails"
              description="Automatically send emails when new business cards are scanned"
            >
              <Switch
                value={isEnabled}
                onValueChange={setIsEnabled}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={isEnabled ? colors.accent : '#f4f3f4'}
              />
            </ConfigItem>

          {isEnabled && (
            <>
              <ConfigItem 
                title="Sender Email"
                description="Email address to send notifications from"
                showHelpIcon={true}
                onHelpPress={showSenderEmailHelp}
              >
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: colors.background, 
                    color: colors.text,
                    borderColor: colors.divider 
                  }]}
                  value={senderEmail}
                  onChangeText={setSenderEmail}
                  placeholder="your.email@gmail.com"
                  placeholderTextColor={colors.secondaryText}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </ConfigItem>

              <ConfigItem 
                title="Email Password"
                description="App password or email account password"
                showHelpIcon={true}
                onHelpPress={showSenderPasswordHelp}
              >
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: colors.background, 
                    color: colors.text,
                    borderColor: colors.divider 
                  }]}
                  value={senderPassword}
                  onChangeText={setSenderPassword}
                  placeholder="App password or email password"
                  placeholderTextColor={colors.secondaryText}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </ConfigItem>

              <ConfigItem 
                title="SMTP Configuration"
                description="SMTP server and port settings"
                showHelpIcon={true}
                onHelpPress={showSmtpHelp}
              >
                <View style={styles.smtpContainer}>
                  <TextInput
                    style={[styles.smtpHostInput, { 
                      backgroundColor: colors.background, 
                      color: colors.text,
                      borderColor: colors.divider 
                    }]}
                    value={smtpHost}
                    onChangeText={setSmtpHost}
                    placeholder="smtp.gmail.com"
                    placeholderTextColor={colors.secondaryText}
                    autoCapitalize="none"
                  />
                  <TextInput
                    style={[styles.smtpPortInput, { 
                      backgroundColor: colors.background, 
                      color: colors.text,
                      borderColor: colors.divider 
                    }]}
                    value={smtpPort}
                    onChangeText={setSmtpPort}
                    placeholder="587"
                    placeholderTextColor={colors.secondaryText}
                    keyboardType="numeric"
                  />
                </View>
              </ConfigItem>

              <ConfigItem 
                title="Recipient Email"
                description="Email address to receive notifications"
              >
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: colors.background, 
                    color: colors.text,
                    borderColor: colors.divider 
                  }]}
                  value={recipientEmail}
                  onChangeText={setRecipientEmail}
                  placeholder="recipient@example.com"
                  placeholderTextColor={colors.secondaryText}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </ConfigItem>

              <ConfigItem 
                title="Email Subject"
                description="Subject line for automated emails"
              >
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: colors.background, 
                    color: colors.text,
                    borderColor: colors.divider 
                  }]}
                  value={emailSubject}
                  onChangeText={setEmailSubject}
                  placeholder="New Business Card Scanned"
                  placeholderTextColor={colors.secondaryText}
                />
              </ConfigItem>

              <ConfigItem 
                title="Email Template"
                description="Message template for automated emails"
              >
                <TextInput
                  style={[styles.textAreaInput, { 
                    backgroundColor: colors.background, 
                    color: colors.text,
                    borderColor: colors.divider 
                  }]}
                  value={emailTemplate}
                  onChangeText={setEmailTemplate}
                  placeholder="Email template..."
                  placeholderTextColor={colors.secondaryText}
                  multiline
                  numberOfLines={4}
                />
              </ConfigItem>

              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={[styles.testButton, { backgroundColor: colors.filterBackground }]}
                  onPress={handleTestEmail}
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <Text style={[styles.testButtonText, { color: colors.text }]}>Test Email</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={[styles.saveButton, { backgroundColor: colors.accent }]}
                  onPress={handleSaveConfiguration}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Configuration</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Bottom padding to ensure last items are visible */}
          <View style={styles.bottomPadding} />
        </ScrollView>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    color: 'black',
    fontWeight: '500',
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
    marginTop: 16,
  },
  configItem: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    borderRadius: 16,
  },
  configItemHeader: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  configItemTitle: {
    fontSize: 17,
    color: '#1F2937',
    fontWeight: '500',
    marginBottom: 4,
    flex: 1,
  },
  helpIcon: {
    marginLeft: 8,
  },
  configItemDescription: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  smtpContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  smtpHostInput: {
    flex: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  smtpPortInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textAreaInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  testButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});
