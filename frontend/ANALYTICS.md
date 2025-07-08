# Quiz Dojo Analytics Guide

## Overview
Quiz Dojo now includes comprehensive user tracking through Google Analytics. This guide explains how to view your user metrics and understand the data.

## What's Being Tracked

### User Identification
- **Anonymous User IDs**: Each browser gets a unique ID stored in localStorage
- **Session IDs**: Each visit gets a unique session ID
- **Return Visitors**: Tracked through persistent user IDs

### Events Tracked
1. **Page Views**: Every page navigation
2. **Room Creation**: When users create quiz rooms
3. **Room Joining**: When users join existing rooms
4. **Quiz Start**: When a quiz begins
5. **Question Answers**: Each question answered (correct/incorrect, time used)
6. **Quiz Completion**: When quizzes finish
7. **Language Changes**: When users switch languages
8. **Session Start/End**: Session duration tracking
9. **Button Clicks**: Key user interactions

## How to View Your Analytics

### 1. Google Analytics Dashboard
1. Go to [Google Analytics](https://analytics.google.com)
2. Sign in with your Google account
3. Select your Quiz Dojo property (ID: G-24XN0CK5HB)
4. Navigate to **Reports** → **Engagement** → **Events**

### 2. Key Metrics to Monitor

#### User Metrics
- **Users**: Total unique visitors
- **Sessions**: Total visits
- **Page Views**: Total page loads
- **Session Duration**: Average time spent

#### Quiz-Specific Metrics
- **room_created**: Number of quiz rooms created
- **room_joined**: Number of room joins
- **quiz_started**: Number of quizzes started
- **quiz_completed**: Number of quizzes finished
- **question_answered**: Number of questions answered

#### Engagement Metrics
- **session_start**: New user sessions
- **language_changed**: Language preference changes
- **button_click**: User interaction patterns

### 3. Custom Reports

#### Daily Active Users
1. Go to **Reports** → **Engagement** → **Events**
2. Filter by event name: `session_start`
3. Set date range to view daily trends

#### Quiz Completion Rate
1. Go to **Reports** → **Engagement** → **Events**
2. Compare `quiz_started` vs `quiz_completed` events
3. Calculate completion rate: (completed / started) × 100

#### Popular Topics
1. Go to **Reports** → **Engagement** → **Events**
2. Filter by event name: `room_created`
3. View event labels to see most popular quiz topics

## Development Dashboard

In development mode, you'll see a floating analytics button (📊) in the bottom-right corner. Click it to see:
- Current user ID and session ID
- Mock analytics data
- Quick link to Google Analytics

## Privacy Considerations

- All tracking is anonymous (no personal information collected)
- User IDs are randomly generated and stored locally
- No personally identifiable information is sent to Google Analytics
- Users can clear their data by clearing browser storage

## Troubleshooting

### No Data Appearing
1. Check that Google Analytics is properly loaded (check browser console)
2. Verify your tracking ID is correct: `G-24XN0CK5HB`
3. Wait 24-48 hours for data to appear in GA

### Missing Events
1. Check browser console for any JavaScript errors
2. Verify that `window.gtag` is available
3. Ensure the analytics utility is properly imported

## Advanced Analytics

For more detailed analytics, consider:
1. **Google Analytics 4 Custom Dimensions**: Track user properties
2. **Google Analytics 4 Custom Metrics**: Track custom measurements
3. **Google Analytics 4 Audiences**: Create user segments
4. **Google Analytics 4 Conversions**: Set up conversion tracking

## Support

If you need help with analytics setup or interpretation, check:
1. [Google Analytics Help Center](https://support.google.com/analytics)
2. [Google Analytics 4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4) 