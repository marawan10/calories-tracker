const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  nameAr: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['cardio', 'strength', 'sports', 'daily', 'other'],
    default: 'cardio'
  },
  duration: {
    type: Number, // in minutes
    required: true,
    min: 1,
    max: 1440 // max 24 hours
  },
  intensity: {
    type: String,
    enum: ['low', 'moderate', 'high', 'very_high'],
    default: 'moderate'
  },
  caloriesBurned: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  // MET (Metabolic Equivalent of Task) value for the activity
  metValue: {
    type: Number,
    required: true,
    min: 1,
    max: 25
  }
}, {
  timestamps: true
});

// Index for efficient queries
activitySchema.index({ user: 1, date: -1 });
activitySchema.index({ user: 1, type: 1 });

// Static method to get predefined activities with MET values
activitySchema.statics.getPredefinedActivities = function() {
  return [
    // Cardio Activities
    { name: 'Walking (slow pace)', nameAr: 'المشي (بطيء)', type: 'cardio', metValue: 3.0, intensity: 'low' },
    { name: 'Walking (moderate pace)', nameAr: 'المشي (متوسط)', type: 'cardio', metValue: 3.5, intensity: 'moderate' },
    { name: 'Walking (fast pace)', nameAr: 'المشي (سريع)', type: 'cardio', metValue: 4.3, intensity: 'high' },
    { name: 'Jogging', nameAr: 'الهرولة', type: 'cardio', metValue: 7.0, intensity: 'high' },
    { name: 'Running (6 mph)', nameAr: 'الجري (متوسط)', type: 'cardio', metValue: 9.8, intensity: 'high' },
    { name: 'Running (8 mph)', nameAr: 'الجري (سريع)', type: 'cardio', metValue: 11.8, intensity: 'very_high' },
    { name: 'Cycling (leisure)', nameAr: 'ركوب الدراجة (ترفيهي)', type: 'cardio', metValue: 4.0, intensity: 'low' },
    { name: 'Cycling (moderate)', nameAr: 'ركوب الدراجة (متوسط)', type: 'cardio', metValue: 6.8, intensity: 'moderate' },
    { name: 'Cycling (vigorous)', nameAr: 'ركوب الدراجة (مكثف)', type: 'cardio', metValue: 10.0, intensity: 'high' },
    { name: 'Swimming (leisure)', nameAr: 'السباحة (ترفيهية)', type: 'cardio', metValue: 6.0, intensity: 'moderate' },
    { name: 'Swimming (vigorous)', nameAr: 'السباحة (مكثفة)', type: 'cardio', metValue: 10.0, intensity: 'high' },
    
    // Strength Training
    { name: 'Weight lifting (light)', nameAr: 'رفع الأثقال (خفيف)', type: 'strength', metValue: 3.0, intensity: 'low' },
    { name: 'Weight lifting (moderate)', nameAr: 'رفع الأثقال (متوسط)', type: 'strength', metValue: 5.0, intensity: 'moderate' },
    { name: 'Weight lifting (vigorous)', nameAr: 'رفع الأثقال (مكثف)', type: 'strength', metValue: 6.0, intensity: 'high' },
    { name: 'Bodyweight exercises', nameAr: 'تمارين وزن الجسم', type: 'strength', metValue: 4.5, intensity: 'moderate' },
    { name: 'Push-ups, sit-ups', nameAr: 'الضغط والبطن', type: 'strength', metValue: 3.8, intensity: 'moderate' },
    
    // Sports
    { name: 'Football/Soccer', nameAr: 'كرة القدم', type: 'sports', metValue: 7.0, intensity: 'high' },
    { name: 'Basketball', nameAr: 'كرة السلة', type: 'sports', metValue: 6.5, intensity: 'high' },
    { name: 'Tennis', nameAr: 'التنس', type: 'sports', metValue: 7.3, intensity: 'high' },
    { name: 'Volleyball', nameAr: 'الكرة الطائرة', type: 'sports', metValue: 4.0, intensity: 'moderate' },
    { name: 'Badminton', nameAr: 'الريشة الطائرة', type: 'sports', metValue: 5.5, intensity: 'moderate' },
    
    // Daily Activities
    { name: 'Household cleaning', nameAr: 'تنظيف المنزل', type: 'daily', metValue: 3.3, intensity: 'low' },
    { name: 'Gardening', nameAr: 'البستنة', type: 'daily', metValue: 4.0, intensity: 'moderate' },
    { name: 'Stairs climbing', nameAr: 'صعود الدرج', type: 'daily', metValue: 8.0, intensity: 'high' },
    { name: 'Dancing', nameAr: 'الرقص', type: 'other', metValue: 4.8, intensity: 'moderate' },
    { name: 'Yoga', nameAr: 'اليوغا', type: 'other', metValue: 2.5, intensity: 'low' },
    { name: 'Pilates', nameAr: 'البيلاتس', type: 'other', metValue: 3.0, intensity: 'low' }
  ];
};

// Static method to calculate calories burned
activitySchema.statics.calculateCaloriesBurned = function(metValue, weightKg, durationMinutes) {
  // Formula: Calories = MET × weight (kg) × time (hours)
  const hours = durationMinutes / 60;
  return Math.round(metValue * weightKg * hours);
};

// Instance method to recalculate calories based on user weight
activitySchema.methods.recalculateCalories = function(userWeight) {
  const hours = this.duration / 60;
  this.caloriesBurned = Math.round(this.metValue * userWeight * hours);
  return this.caloriesBurned;
};

module.exports = mongoose.model('Activity', activitySchema);
