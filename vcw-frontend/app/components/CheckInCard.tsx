import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Divider
} from '@mui/material';
import {
  Person as PersonIcon,
  CardMembership as MembershipIcon,
  CalendarToday as CalendarIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';

interface CheckInCardProps {
  credentials: any[];
  benefitName?: string;
  userName?: string;
  expiryDate?: string;
  usesRemaining?: number;
}

export default function CheckInCard({
  credentials,
  benefitName,
  userName,
  expiryDate,
  usesRemaining
}: CheckInCardProps) {
  // Extract first credential for display
  const primaryCredential = credentials[0];
  
  // Get the actual credential object (might be nested)
  const credentialData = primaryCredential?.credential || primaryCredential;
  const credentialSubject = credentialData?.credentialSubject;
  const metadata = primaryCredential?.metadata;
  
  // Use fallback values from credentialSubject or metadata if props are undefined
  const displayName = userName || credentialSubject?.name || metadata?.name || 'Member';
  const displayBenefit = benefitName || credentialSubject?.benefitName || metadata?.benefitName || 'Standard Plan';
  const displayExpiry = expiryDate || primaryCredential?.expireDate || credentialData?.validUntil;
  const displayPlan = credentialSubject?.membershipPlan || metadata?.plan;
  
  console.log('CheckInCard - Final Display Values:', {
    displayName,
    displayBenefit,
    displayExpiry,
    displayPlan,
    usesRemaining
  });
  
  // Extract user initials for avatar
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card
      sx={{
        maxWidth: 500,
        mx: 'auto',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        borderRadius: 3,
        overflow: 'visible'
      }}
    >
      <CardContent sx={{ p: 0 }}>
        {/* Header Section */}
        <Box
          sx={{
            p: 3,
            pb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: 'rgba(255,255,255,0.3)',
              fontSize: '2rem',
              fontWeight: 'bold',
              border: '3px solid white'
            }}
          >
            {getInitials(userName)}
          </Avatar>
          <Box flex={1}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {displayName}
            </Typography>
            <Chip
              icon={<VerifiedIcon sx={{ color: 'white !important' }} />}
              label="VERIFIED MEMBER"
              size="small"
              sx={{
                bgcolor: 'rgba(255,255,255,0.25)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.7rem'
              }}
            />
          </Box>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.3)' }} />

        {/* Membership Details Section */}
        <Box sx={{ bgcolor: 'white', color: 'text.primary', p: 3 }}>
          {/* Benefit Name */}
          <Box mb={2}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <MembershipIcon color="primary" />
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
                Membership Plan
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              {displayBenefit}
            </Typography>
            {displayPlan && displayPlan !== 'Unknown' && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Plan Type: {displayPlan}
              </Typography>
            )}
          </Box>

          {/* Expiry Date & Uses Remaining Row */}
          <Box display="flex" gap={3} mb={2}>
            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <CalendarIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Valid Until
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {formatDate(displayExpiry)}
              </Typography>
            </Box>

            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <PersonIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Visits Left
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {usesRemaining ?? 'Unlimited'}
                </Typography>
                {usesRemaining !== undefined && (
                  <Chip
                    label={usesRemaining > 5 ? 'Good' : 'Low'}
                    size="small"
                    color={usesRemaining > 5 ? 'success' : 'warning'}
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                )}
              </Box>
            </Box>
          </Box>

          {/* Credential ID */}
          {credentialData?.id && (
            <Box mb={2}>
              <Divider sx={{ my: 1 }} />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Credential ID
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    bgcolor: 'grey.100',
                    p: 1,
                    borderRadius: 1,
                    mt: 0.5,
                    wordBreak: 'break-all'
                  }}
                >
                  {credentialData.id}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Credential Type */}
          {credentialData?.type && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
                Credential Type
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {Array.isArray(credentialData.type) 
                  ? credentialData.type.join(', ') 
                  : credentialData.type}
              </Typography>
            </Box>
          )}

          {/* Additional Info from credentialSubject */}
          {credentialSubject && (
            <Box mt={2}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold', mb: 1, display: 'block' }}>
                Membership Details
              </Typography>
              
              {credentialSubject.membershipId && (
                <Box mb={1}>
                  <Typography variant="caption" color="text.secondary">
                    Membership ID:
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {credentialSubject.membershipId}
                  </Typography>
                </Box>
              )}
              
              {credentialSubject.gymLocation && (
                <Box mb={1}>
                  <Typography variant="caption" color="text.secondary">
                    Gym Location:
                  </Typography>
                  <Typography variant="body2">
                    {credentialSubject.gymLocation}
                  </Typography>
                </Box>
              )}
              
              {credentialSubject.issuingFacility && (
                <Box mb={1}>
                  <Typography variant="caption" color="text.secondary">
                    Issuing Facility:
                  </Typography>
                  <Typography variant="body2">
                    {credentialSubject.issuingFacility}
                  </Typography>
                </Box>
              )}
              
              {credentialSubject.requiresBooking !== undefined && (
                <Box mb={1}>
                  <Chip
                    label={credentialSubject.requiresBooking ? 'Booking Required' : 'No Booking Required'}
                    size="small"
                    color={credentialSubject.requiresBooking ? 'warning' : 'success'}
                    sx={{ fontSize: '0.7rem' }}
                  />
                </Box>
              )}
              
              {/* Services Section */}
              {credentialSubject.services && Array.isArray(credentialSubject.services) && credentialSubject.services.length > 0 && (
                <Box mt={2}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold', mb: 1, display: 'block' }}>
                    Included Services ({credentialSubject.services.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {credentialSubject.services.map((service: any, index: number) => (
                      <Box
                        key={service.id || index}
                        sx={{
                          p: 1.5,
                          bgcolor: 'grey.50',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'grey.200'
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            {service.name}
                          </Typography>
                          {service.category && (
                            <Chip
                              label={service.category}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.65rem',
                                bgcolor: 'primary.light',
                                color: 'primary.contrastText'
                              }}
                            />
                          )}
                        </Box>
                        {service.description && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                            {service.description}
                          </Typography>
                        )}
                        {service.metadata && (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {service.metadata.hours && (
                              <Chip
                                label={`⏰ ${service.metadata.hours}`}
                                size="small"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.65rem' }}
                              />
                            )}
                            {service.metadata.capacity && (
                              <Chip
                                label={`👥 Cap: ${service.metadata.capacity}`}
                                size="small"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.65rem' }}
                              />
                            )}
                            {service.metadata.location && (
                              <Chip
                                label={`📍 ${service.metadata.location}`}
                                size="small"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.65rem' }}
                              />
                            )}
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {/* Metadata Info */}
          {metadata && (
            <Box mt={2}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold', mb: 1, display: 'block' }}>
                Additional Metadata
              </Typography>
              
              {metadata.benefitId && (
                <Box mb={1}>
                  <Typography variant="caption" color="text.secondary">
                    Benefit ID:
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {metadata.benefitId}
                  </Typography>
                </Box>
              )}
              
              {metadata.createdAt && (
                <Box mb={1}>
                  <Typography variant="caption" color="text.secondary">
                    Created:
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(metadata.createdAt)}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>

        {/* Footer Badge */}
        <Box
          sx={{
            p: 2,
            textAlign: 'center',
            bgcolor: 'rgba(0,0,0,0.1)'
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 'bold', opacity: 0.9 }}>
            {credentials.length} CREDENTIAL{credentials.length > 1 ? 'S' : ''} VERIFIED
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
