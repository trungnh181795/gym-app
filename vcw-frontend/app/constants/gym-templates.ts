import type { Benefit } from '../types';

export const GYM_MEMBERSHIP_TEMPLATES = {
  basic: {
    name: 'Basic Membership',
    description: 'Essential gym access for individual fitness goals',
    price: 29.99,
    benefits: [
      {
        type: 'gym_access' as const,
        name: 'Gym Floor Access',
        description: 'Full access to all gym equipment, weights, and cardio machines during operating hours',
        requiresBooking: false,
      },
    ] as Benefit[],
  },
  
  premium: {
    name: 'Premium Membership',
    description: 'Complete fitness experience with pool and wellness access',
    price: 49.99,
    benefits: [
      {
        type: 'gym_access' as const,
        name: 'Gym Floor Access',
        description: 'Full access to all gym equipment, weights, and cardio machines during operating hours',
        requiresBooking: false,
      },
      {
        type: 'pool_access' as const,
        name: 'Swimming Pool Access',
        description: 'Access to swimming pool, lap lanes, and aquatic fitness programs',
        requiresBooking: false,
      },
      {
        type: 'sauna_access' as const,
        name: 'Wellness Facilities',
        description: 'Sauna, steam room, and relaxation areas for post-workout recovery',
        requiresBooking: false,
      },
    ] as Benefit[],
  },
  
  elite: {
    name: 'Elite Membership',
    description: 'Ultimate fitness package with personal training and group classes',
    price: 79.99,
    benefits: [
      {
        type: 'gym_access' as const,
        name: 'Gym Floor Access',
        description: 'Full access to all gym equipment, weights, and cardio machines during operating hours',
        requiresBooking: false,
      },
      {
        type: 'pool_access' as const,
        name: 'Swimming Pool Access',
        description: 'Access to swimming pool, lap lanes, and aquatic fitness programs',
        requiresBooking: false,
      },
      {
        type: 'sauna_access' as const,
        name: 'Wellness Facilities',
        description: 'Sauna, steam room, and relaxation areas for post-workout recovery',
        requiresBooking: false,
      },
      {
        type: 'group_classes' as const,
        name: 'Group Fitness Classes',
        description: 'Unlimited access to yoga, pilates, spinning, HIIT, and dance classes',
        requiresBooking: true,
      },
      {
        type: 'personal_trainer' as const,
        name: 'Personal Training Sessions',
        description: 'Monthly one-on-one sessions with certified personal trainers',
        maxUsesPerMonth: 4,
        requiresBooking: true,
      },
    ] as Benefit[],
  },
  
  platinum: {
    name: 'Platinum Membership',
    description: 'Complete wellness package with nutrition support and unlimited services',
    price: 99.99,
    benefits: [
      {
        type: 'gym_access' as const,
        name: 'Gym Floor Access',
        description: 'Full access to all gym equipment, weights, and cardio machines during operating hours',
        requiresBooking: false,
      },
      {
        type: 'pool_access' as const,
        name: 'Swimming Pool Access',
        description: 'Access to swimming pool, lap lanes, and aquatic fitness programs',
        requiresBooking: false,
      },
      {
        type: 'sauna_access' as const,
        name: 'Wellness Facilities',
        description: 'Sauna, steam room, and relaxation areas for post-workout recovery',
        requiresBooking: false,
      },
      {
        type: 'group_classes' as const,
        name: 'Group Fitness Classes',
        description: 'Unlimited access to yoga, pilates, spinning, HIIT, and dance classes',
        requiresBooking: true,
      },
      {
        type: 'personal_trainer' as const,
        name: 'Personal Training Sessions',
        description: 'Weekly one-on-one sessions with certified personal trainers',
        maxUsesPerMonth: 8,
        requiresBooking: true,
      },
      {
        type: 'nutrition_consultation' as const,
        name: 'Nutrition Consultation',
        description: 'Monthly consultation with certified nutritionist and personalized meal plans',
        maxUsesPerMonth: 2,
        requiresBooking: true,
      },
    ] as Benefit[],
  },
};

export const BENEFIT_DESCRIPTIONS = {
  gym_access: {
    title: 'Gym Floor Access',
    description: 'Full access to all gym equipment, weights, and cardio machines',
    features: [
      'State-of-the-art equipment',
      'Free weights and machines',
      'Cardio equipment with entertainment',
      'Locker room facilities',
    ],
  },
  pool_access: {
    title: 'Swimming Pool Access',
    description: 'Access to pool facilities and aquatic fitness programs',
    features: [
      '25-meter lap pool',
      'Aqua fitness classes',
      'Pool-side relaxation area',
      'Professional lifeguard on duty',
    ],
  },
  sauna_access: {
    title: 'Wellness Facilities',
    description: 'Sauna, steam room, and relaxation areas',
    features: [
      'Finnish sauna',
      'Steam room',
      'Relaxation lounge',
      'Hot/cold therapy areas',
    ],
  },
  personal_trainer: {
    title: 'Personal Training',
    description: 'One-on-one sessions with certified trainers',
    features: [
      'Customized workout plans',
      'Form correction and technique',
      'Goal-oriented training',
      'Progress tracking and assessment',
    ],
  },
  group_classes: {
    title: 'Group Fitness Classes',
    description: 'Diverse group fitness programs',
    features: [
      'Yoga and pilates',
      'High-intensity interval training',
      'Spinning and cycling classes',
      'Dance and aerobics',
    ],
  },
  nutrition_consultation: {
    title: 'Nutrition Services',
    description: 'Professional nutrition guidance',
    features: [
      'Personalized meal planning',
      'Nutritional assessment',
      'Supplement recommendations',
      'Progress monitoring',
    ],
  },
};