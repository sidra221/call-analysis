import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_ar.dart';
import 'app_localizations_en.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
      : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('ar'),
    Locale('en')
  ];

  /// No description provided for @filters.
  ///
  /// In en, this message translates to:
  /// **'Filters'**
  String get filters;

  /// No description provided for @clear.
  ///
  /// In en, this message translates to:
  /// **'Clear'**
  String get clear;

  /// No description provided for @appTitle.
  ///
  /// In en, this message translates to:
  /// **'Call Center Manager'**
  String get appTitle;

  /// No description provided for @settings.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get settings;

  /// No description provided for @language.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get language;

  /// No description provided for @english.
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get english;

  /// No description provided for @arabic.
  ///
  /// In en, this message translates to:
  /// **'Arabic'**
  String get arabic;

  /// No description provided for @languageUpdated.
  ///
  /// In en, this message translates to:
  /// **'Language updated successfully.'**
  String get languageUpdated;

  /// No description provided for @selectPreferredLanguage.
  ///
  /// In en, this message translates to:
  /// **'Select your preferred language'**
  String get selectPreferredLanguage;

  /// No description provided for @preferences.
  ///
  /// In en, this message translates to:
  /// **'Preferences'**
  String get preferences;

  /// No description provided for @darkMode.
  ///
  /// In en, this message translates to:
  /// **'Dark Mode'**
  String get darkMode;

  /// No description provided for @enableDarkTheme.
  ///
  /// In en, this message translates to:
  /// **'Enable dark theme'**
  String get enableDarkTheme;

  /// No description provided for @notifications.
  ///
  /// In en, this message translates to:
  /// **'Notifications'**
  String get notifications;

  /// No description provided for @manageNotificationPreferences.
  ///
  /// In en, this message translates to:
  /// **'Manage notification preferences'**
  String get manageNotificationPreferences;

  /// No description provided for @account.
  ///
  /// In en, this message translates to:
  /// **'Account'**
  String get account;

  /// No description provided for @profile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get profile;

  /// No description provided for @editProfileInformation.
  ///
  /// In en, this message translates to:
  /// **'Edit your profile information'**
  String get editProfileInformation;

  /// No description provided for @security.
  ///
  /// In en, this message translates to:
  /// **'Security'**
  String get security;

  /// No description provided for @passwordAndLoginSettings.
  ///
  /// In en, this message translates to:
  /// **'Password and login settings'**
  String get passwordAndLoginSettings;

  /// No description provided for @logOut.
  ///
  /// In en, this message translates to:
  /// **'Log Out'**
  String get logOut;

  /// No description provided for @dashboard.
  ///
  /// In en, this message translates to:
  /// **'Dashboard'**
  String get dashboard;

  /// No description provided for @welcomeBack.
  ///
  /// In en, this message translates to:
  /// **'Welcome back,'**
  String get welcomeBack;

  /// No description provided for @totalCalls.
  ///
  /// In en, this message translates to:
  /// **'Total Calls'**
  String get totalCalls;

  /// No description provided for @completed.
  ///
  /// In en, this message translates to:
  /// **'Completed'**
  String get completed;

  /// No description provided for @inProgress.
  ///
  /// In en, this message translates to:
  /// **'In Progress'**
  String get inProgress;

  /// No description provided for @highPriority.
  ///
  /// In en, this message translates to:
  /// **'High Priority'**
  String get highPriority;

  /// No description provided for @topNegativeIssues.
  ///
  /// In en, this message translates to:
  /// **'Top Negative Issues'**
  String get topNegativeIssues;

  /// No description provided for @topPositiveFeedback.
  ///
  /// In en, this message translates to:
  /// **'Top Positive Feedback'**
  String get topPositiveFeedback;

  /// No description provided for @priorityFollowUps.
  ///
  /// In en, this message translates to:
  /// **'Priority Follow-ups'**
  String get priorityFollowUps;

  /// No description provided for @viewAll.
  ///
  /// In en, this message translates to:
  /// **'View all'**
  String get viewAll;

  /// No description provided for @failedToLoadSummary.
  ///
  /// In en, this message translates to:
  /// **'Failed to load summary'**
  String get failedToLoadSummary;

  /// No description provided for @mentions.
  ///
  /// In en, this message translates to:
  /// **'mentions'**
  String get mentions;

  /// No description provided for @trendUp.
  ///
  /// In en, this message translates to:
  /// **'Up'**
  String get trendUp;

  /// No description provided for @trendDown.
  ///
  /// In en, this message translates to:
  /// **'Down'**
  String get trendDown;

  /// No description provided for @trendStable.
  ///
  /// In en, this message translates to:
  /// **'Stable'**
  String get trendStable;

  /// No description provided for @calls.
  ///
  /// In en, this message translates to:
  /// **'Calls'**
  String get calls;

  /// No description provided for @searchByCallerName.
  ///
  /// In en, this message translates to:
  /// **'Search by caller name...'**
  String get searchByCallerName;

  /// No description provided for @priority.
  ///
  /// In en, this message translates to:
  /// **'Priority'**
  String get priority;

  /// No description provided for @sentiment.
  ///
  /// In en, this message translates to:
  /// **'Sentiment'**
  String get sentiment;

  /// No description provided for @all.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get all;

  /// No description provided for @noCallsFound.
  ///
  /// In en, this message translates to:
  /// **'No calls found'**
  String get noCallsFound;

  /// No description provided for @tryChangingFilters.
  ///
  /// In en, this message translates to:
  /// **'Try changing your filters or search'**
  String get tryChangingFilters;

  /// No description provided for @callDetails.
  ///
  /// In en, this message translates to:
  /// **'Call Details'**
  String get callDetails;

  /// No description provided for @copiedToClipboard.
  ///
  /// In en, this message translates to:
  /// **'Copied to clipboard!'**
  String get copiedToClipboard;

  /// No description provided for @withAgent.
  ///
  /// In en, this message translates to:
  /// **'with'**
  String get withAgent;

  /// No description provided for @id.
  ///
  /// In en, this message translates to:
  /// **'ID'**
  String get id;

  /// No description provided for @callRecording.
  ///
  /// In en, this message translates to:
  /// **'Call Recording'**
  String get callRecording;

  /// No description provided for @recordingWillAppear.
  ///
  /// In en, this message translates to:
  /// **'Recording will appear here when available'**
  String get recordingWillAppear;

  /// No description provided for @summary.
  ///
  /// In en, this message translates to:
  /// **'Summary'**
  String get summary;

  /// No description provided for @mainIssue.
  ///
  /// In en, this message translates to:
  /// **'Main Issue'**
  String get mainIssue;

  /// No description provided for @keywords.
  ///
  /// In en, this message translates to:
  /// **'Keywords'**
  String get keywords;

  /// No description provided for @markResolved.
  ///
  /// In en, this message translates to:
  /// **'Mark Resolved'**
  String get markResolved;

  /// No description provided for @addNote.
  ///
  /// In en, this message translates to:
  /// **'Add Note'**
  String get addNote;

  /// No description provided for @scheduleFollowUp.
  ///
  /// In en, this message translates to:
  /// **'Schedule Follow-up'**
  String get scheduleFollowUp;

  /// No description provided for @failedToLoadCallDetails.
  ///
  /// In en, this message translates to:
  /// **'Failed to load call details'**
  String get failedToLoadCallDetails;

  /// No description provided for @reports.
  ///
  /// In en, this message translates to:
  /// **'Reports'**
  String get reports;

  /// No description provided for @noReports.
  ///
  /// In en, this message translates to:
  /// **'No reports'**
  String get noReports;

  /// No description provided for @checkBackLater.
  ///
  /// In en, this message translates to:
  /// **'Check back later'**
  String get checkBackLater;

  /// No description provided for @failedToLoadReports.
  ///
  /// In en, this message translates to:
  /// **'Failed to load reports'**
  String get failedToLoadReports;

  /// No description provided for @reportDetails.
  ///
  /// In en, this message translates to:
  /// **'Report Details'**
  String get reportDetails;

  /// No description provided for @recommendations.
  ///
  /// In en, this message translates to:
  /// **'Recommendations'**
  String get recommendations;

  /// No description provided for @failedToLoadReport.
  ///
  /// In en, this message translates to:
  /// **'Failed to load report'**
  String get failedToLoadReport;

  /// No description provided for @notificationsTitle.
  ///
  /// In en, this message translates to:
  /// **'Notifications'**
  String get notificationsTitle;

  /// No description provided for @noNotifications.
  ///
  /// In en, this message translates to:
  /// **'No Notifications'**
  String get noNotifications;

  /// No description provided for @allCaughtUp.
  ///
  /// In en, this message translates to:
  /// **'You\'re all caught up!'**
  String get allCaughtUp;

  /// No description provided for @failedToLoadNotifications.
  ///
  /// In en, this message translates to:
  /// **'Failed to load notifications'**
  String get failedToLoadNotifications;

  /// No description provided for @login.
  ///
  /// In en, this message translates to:
  /// **'Login'**
  String get login;

  /// No description provided for @welcomeBackTitle.
  ///
  /// In en, this message translates to:
  /// **'Welcome Back'**
  String get welcomeBackTitle;

  /// No description provided for @signInToManage.
  ///
  /// In en, this message translates to:
  /// **'Sign in to manage your calls '**
  String get signInToManage;

  /// No description provided for @email.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get email;

  /// No description provided for @emailHint.
  ///
  /// In en, this message translates to:
  /// **'manager@example.com'**
  String get emailHint;

  /// No description provided for @password.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get password;

  /// No description provided for @passwordHint.
  ///
  /// In en, this message translates to:
  /// **'••••••••'**
  String get passwordHint;

  /// No description provided for @signIn.
  ///
  /// In en, this message translates to:
  /// **'Sign In'**
  String get signIn;

  /// No description provided for @emailRequired.
  ///
  /// In en, this message translates to:
  /// **'Email is required'**
  String get emailRequired;

  /// No description provided for @enterValidEmail.
  ///
  /// In en, this message translates to:
  /// **'Please enter a valid email'**
  String get enterValidEmail;

  /// No description provided for @passwordRequired.
  ///
  /// In en, this message translates to:
  /// **'Password must be at least 6 characters'**
  String get passwordRequired;

  /// No description provided for @unknownError.
  ///
  /// In en, this message translates to:
  /// **'Unknown error'**
  String get unknownError;

  /// No description provided for @splashTitle.
  ///
  /// In en, this message translates to:
  /// **'Call Center'**
  String get splashTitle;

  /// No description provided for @splashSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Manager Dashboard'**
  String get splashSubtitle;

  /// No description provided for @logs.
  ///
  /// In en, this message translates to:
  /// **'System Logs'**
  String get logs;

  /// No description provided for @noLogsFound.
  ///
  /// In en, this message translates to:
  /// **'No logs found'**
  String get noLogsFound;

  /// No description provided for @checkBackLaterLogs.
  ///
  /// In en, this message translates to:
  /// **'Check back later'**
  String get checkBackLaterLogs;

  /// No description provided for @failedToLoadLogs.
  ///
  /// In en, this message translates to:
  /// **'Failed to load logs'**
  String get failedToLoadLogs;

  /// No description provided for @emptyViewMessage.
  ///
  /// In en, this message translates to:
  /// **'No items found'**
  String get emptyViewMessage;

  /// No description provided for @emptyViewSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Check back later'**
  String get emptyViewSubtitle;

  /// No description provided for @errorViewRetry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get errorViewRetry;

  /// No description provided for @statusCompleted.
  ///
  /// In en, this message translates to:
  /// **'Completed'**
  String get statusCompleted;

  /// No description provided for @statusInProgress.
  ///
  /// In en, this message translates to:
  /// **'In Progress'**
  String get statusInProgress;

  /// No description provided for @statusPending.
  ///
  /// In en, this message translates to:
  /// **'Pending'**
  String get statusPending;

  /// No description provided for @statusProcessing.
  ///
  /// In en, this message translates to:
  /// **'Processing'**
  String get statusProcessing;

  /// No description provided for @statusFailed.
  ///
  /// In en, this message translates to:
  /// **'Failed'**
  String get statusFailed;

  /// No description provided for @priorityHigh.
  ///
  /// In en, this message translates to:
  /// **'High'**
  String get priorityHigh;

  /// No description provided for @priorityMedium.
  ///
  /// In en, this message translates to:
  /// **'Medium'**
  String get priorityMedium;

  /// No description provided for @priorityLow.
  ///
  /// In en, this message translates to:
  /// **'Low'**
  String get priorityLow;

  /// No description provided for @sentimentPositive.
  ///
  /// In en, this message translates to:
  /// **'Positive'**
  String get sentimentPositive;

  /// No description provided for @sentimentNeutral.
  ///
  /// In en, this message translates to:
  /// **'Neutral'**
  String get sentimentNeutral;

  /// No description provided for @sentimentNegative.
  ///
  /// In en, this message translates to:
  /// **'Negative'**
  String get sentimentNegative;

  /// No description provided for @sentimentNA.
  ///
  /// In en, this message translates to:
  /// **'N/A'**
  String get sentimentNA;

  /// No description provided for @manager.
  ///
  /// In en, this message translates to:
  /// **'Manager'**
  String get manager;

  /// No description provided for @lightMode.
  ///
  /// In en, this message translates to:
  /// **'Light Mode'**
  String get lightMode;

  /// No description provided for @logoutConfirmation.
  ///
  /// In en, this message translates to:
  /// **'Are you sure you want to log out?'**
  String get logoutConfirmation;

  /// No description provided for @loggedOutSuccessfully.
  ///
  /// In en, this message translates to:
  /// **'Logged out successfully'**
  String get loggedOutSuccessfully;

  /// No description provided for @analysis.
  ///
  /// In en, this message translates to:
  /// **'Analysis'**
  String get analysis;

  /// No description provided for @transcript.
  ///
  /// In en, this message translates to:
  /// **'Transcript'**
  String get transcript;

  /// No description provided for @audio.
  ///
  /// In en, this message translates to:
  /// **'Audio'**
  String get audio;

  /// No description provided for @followUp.
  ///
  /// In en, this message translates to:
  /// **'Follow-up'**
  String get followUp;

  /// No description provided for @actions.
  ///
  /// In en, this message translates to:
  /// **'Actions'**
  String get actions;

  /// No description provided for @needsFollowUp.
  ///
  /// In en, this message translates to:
  /// **'Needs Follow-up'**
  String get needsFollowUp;

  /// No description provided for @reason.
  ///
  /// In en, this message translates to:
  /// **'Reason'**
  String get reason;

  /// No description provided for @reanalyze.
  ///
  /// In en, this message translates to:
  /// **'Re-analyze'**
  String get reanalyze;

  /// No description provided for @markReviewed.
  ///
  /// In en, this message translates to:
  /// **'Mark Reviewed'**
  String get markReviewed;

  /// No description provided for @createFollowUp.
  ///
  /// In en, this message translates to:
  /// **'Create Follow-up'**
  String get createFollowUp;

  /// No description provided for @uploadedBy.
  ///
  /// In en, this message translates to:
  /// **'Uploaded by'**
  String get uploadedBy;

  /// No description provided for @confidence.
  ///
  /// In en, this message translates to:
  /// **'Confidence'**
  String get confidence;

  /// No description provided for @splashTagline.
  ///
  /// In en, this message translates to:
  /// **'VOICE INTELLIGENCE. REAL INSIGHT.'**
  String get splashTagline;

  /// No description provided for @username.
  ///
  /// In en, this message translates to:
  /// **'Username'**
  String get username;

  /// No description provided for @usernameRequired.
  ///
  /// In en, this message translates to:
  /// **'Username is required'**
  String get usernameRequired;

  /// No description provided for @enterCredentials.
  ///
  /// In en, this message translates to:
  /// **'Enter your credentials to continue'**
  String get enterCredentials;

  /// No description provided for @loginFailed.
  ///
  /// In en, this message translates to:
  /// **'Login failed'**
  String get loginFailed;

  /// No description provided for @passwordRequiredField.
  ///
  /// In en, this message translates to:
  /// **'Password is required'**
  String get passwordRequiredField;

  /// No description provided for @passwordMinLength.
  ///
  /// In en, this message translates to:
  /// **'Password must be at least 6 characters'**
  String get passwordMinLength;

  /// No description provided for @noAccount.
  ///
  /// In en, this message translates to:
  /// **'Don\'t have an account? '**
  String get noAccount;

  /// No description provided for @register.
  ///
  /// In en, this message translates to:
  /// **'Register'**
  String get register;

  /// No description provided for @home.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get home;

  /// No description provided for @criticalPriority.
  ///
  /// In en, this message translates to:
  /// **'Critical Priority'**
  String get criticalPriority;

  /// No description provided for @mediumPriority.
  ///
  /// In en, this message translates to:
  /// **'Medium Priority'**
  String get mediumPriority;

  /// No description provided for @lowPriority.
  ///
  /// In en, this message translates to:
  /// **'Low Priority'**
  String get lowPriority;

  /// No description provided for @liveFeed.
  ///
  /// In en, this message translates to:
  /// **'Live Feed'**
  String get liveFeed;

  /// No description provided for @noRecentCalls.
  ///
  /// In en, this message translates to:
  /// **'No recent calls'**
  String get noRecentCalls;

  /// No description provided for @callNumber.
  ///
  /// In en, this message translates to:
  /// **'Call #{id}'**
  String callNumber(String id);

  /// No description provided for @failedToLoadLiveFeed.
  ///
  /// In en, this message translates to:
  /// **'Failed to load live feed'**
  String get failedToLoadLiveFeed;

  /// No description provided for @noKeywordsAvailable.
  ///
  /// In en, this message translates to:
  /// **'No keywords available'**
  String get noKeywordsAvailable;

  /// No description provided for @failedToLoadKeywords.
  ///
  /// In en, this message translates to:
  /// **'Failed to load keywords'**
  String get failedToLoadKeywords;

  /// No description provided for @sentimentAnalysis.
  ///
  /// In en, this message translates to:
  /// **'Sentiment Analysis'**
  String get sentimentAnalysis;

  /// No description provided for @sentimentDistribution.
  ///
  /// In en, this message translates to:
  /// **'Distribution of analyzed customer calls.'**
  String get sentimentDistribution;

  /// No description provided for @searchCalls.
  ///
  /// In en, this message translates to:
  /// **'Search calls...'**
  String get searchCalls;

  /// No description provided for @filterCalls.
  ///
  /// In en, this message translates to:
  /// **'Filter Calls'**
  String get filterCalls;

  /// No description provided for @allCalls.
  ///
  /// In en, this message translates to:
  /// **'All Calls'**
  String get allCalls;

  /// No description provided for @searchLogs.
  ///
  /// In en, this message translates to:
  /// **'Search by user, action, or description...'**
  String get searchLogs;

  /// No description provided for @filterLogs.
  ///
  /// In en, this message translates to:
  /// **'Filter Logs'**
  String get filterLogs;

  /// No description provided for @allLogs.
  ///
  /// In en, this message translates to:
  /// **'All Logs'**
  String get allLogs;

  /// No description provided for @tryChangingSearchOrFilters.
  ///
  /// In en, this message translates to:
  /// **'Try changing your search or filters'**
  String get tryChangingSearchOrFilters;

  /// No description provided for @logTypeActivity.
  ///
  /// In en, this message translates to:
  /// **'Activity'**
  String get logTypeActivity;

  /// No description provided for @logTypeSystem.
  ///
  /// In en, this message translates to:
  /// **'System'**
  String get logTypeSystem;

  /// No description provided for @logTypeUserAction.
  ///
  /// In en, this message translates to:
  /// **'User Action'**
  String get logTypeUserAction;

  /// No description provided for @summaryIssuesSolutions.
  ///
  /// In en, this message translates to:
  /// **'Summary (Issues & Solutions)'**
  String get summaryIssuesSolutions;

  /// No description provided for @positives.
  ///
  /// In en, this message translates to:
  /// **'Positives'**
  String get positives;

  /// No description provided for @overallSentiment.
  ///
  /// In en, this message translates to:
  /// **'Overall Sentiment'**
  String get overallSentiment;

  /// No description provided for @topIssues.
  ///
  /// In en, this message translates to:
  /// **'Top Issues'**
  String get topIssues;

  /// No description provided for @managerNotes.
  ///
  /// In en, this message translates to:
  /// **'Manager Notes'**
  String get managerNotes;

  /// No description provided for @reportByAuthor.
  ///
  /// In en, this message translates to:
  /// **'By {author} • {date}'**
  String reportByAuthor(String author, String date);

  /// No description provided for @noDataAvailable.
  ///
  /// In en, this message translates to:
  /// **'No data available'**
  String get noDataAvailable;

  /// No description provided for @noIssuesData.
  ///
  /// In en, this message translates to:
  /// **'No issues data available'**
  String get noIssuesData;

  /// No description provided for @noIssueRecorded.
  ///
  /// In en, this message translates to:
  /// **'No issue recorded'**
  String get noIssueRecorded;

  /// No description provided for @cancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancel;

  /// No description provided for @reviewed.
  ///
  /// In en, this message translates to:
  /// **'Reviewed'**
  String get reviewed;

  /// No description provided for @addNotes.
  ///
  /// In en, this message translates to:
  /// **'Add Notes'**
  String get addNotes;

  /// No description provided for @downloadPdf.
  ///
  /// In en, this message translates to:
  /// **'Download PDF'**
  String get downloadPdf;

  /// No description provided for @failedToLoadReportDetails.
  ///
  /// In en, this message translates to:
  /// **'Failed to load report details'**
  String get failedToLoadReportDetails;

  /// No description provided for @noAudioRecording.
  ///
  /// In en, this message translates to:
  /// **'No audio recording available'**
  String get noAudioRecording;

  /// No description provided for @failedToMarkReviewed.
  ///
  /// In en, this message translates to:
  /// **'Failed to mark call as reviewed'**
  String get failedToMarkReviewed;

  /// No description provided for @user.
  ///
  /// In en, this message translates to:
  /// **'User'**
  String get user;

  /// No description provided for @notifActorSystem.
  ///
  /// In en, this message translates to:
  /// **'System'**
  String get notifActorSystem;

  /// No description provided for @notifActorSomeone.
  ///
  /// In en, this message translates to:
  /// **'Someone'**
  String get notifActorSomeone;

  /// No description provided for @notifActorQa.
  ///
  /// In en, this message translates to:
  /// **'QA'**
  String get notifActorQa;

  /// No description provided for @notifDefaultReportPeriod.
  ///
  /// In en, this message translates to:
  /// **'Report'**
  String get notifDefaultReportPeriod;

  /// No description provided for @notifCallUploaded.
  ///
  /// In en, this message translates to:
  /// **'{user} uploaded a new call #{callId}'**
  String notifCallUploaded(String user, String callId);

  /// No description provided for @notifFollowupAssigned.
  ///
  /// In en, this message translates to:
  /// **'You have a follow-up assigned for call #{callId}'**
  String notifFollowupAssigned(String callId);

  /// No description provided for @notifFollowupStatusCompleted.
  ///
  /// In en, this message translates to:
  /// **'{user} changed status of your follow-up for call #{callId} to completed'**
  String notifFollowupStatusCompleted(String user, String callId);

  /// No description provided for @notifFollowupStatusUpdated.
  ///
  /// In en, this message translates to:
  /// **'{user} changed status of your follow-up for call #{callId} to {status}'**
  String notifFollowupStatusUpdated(String user, String callId, String status);

  /// No description provided for @notifReportPublished.
  ///
  /// In en, this message translates to:
  /// **'{user} published a new report \"{period}\"'**
  String notifReportPublished(String user, String period);

  /// No description provided for @notifReportReviewNotes.
  ///
  /// In en, this message translates to:
  /// **'{user} added notes to your {period} report'**
  String notifReportReviewNotes(String user, String period);

  /// No description provided for @notifReportReviewApproved.
  ///
  /// In en, this message translates to:
  /// **'{user} reviewed your {period} report'**
  String notifReportReviewApproved(String user, String period);

  /// No description provided for @timeJustNow.
  ///
  /// In en, this message translates to:
  /// **'just now'**
  String get timeJustNow;

  /// No description provided for @timeMinutesAgo.
  ///
  /// In en, this message translates to:
  /// **'{count} min ago'**
  String timeMinutesAgo(int count);

  /// No description provided for @timeHoursAgo.
  ///
  /// In en, this message translates to:
  /// **'{count} hour ago'**
  String timeHoursAgo(int count);

  /// No description provided for @timeDaysAgo.
  ///
  /// In en, this message translates to:
  /// **'{count} day ago'**
  String timeDaysAgo(int count);

  /// No description provided for @timeOnDate.
  ///
  /// In en, this message translates to:
  /// **'{month}/{day}/{year}'**
  String timeOnDate(int year, int month, int day);
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['ar', 'en'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'ar':
      return AppLocalizationsAr();
    case 'en':
      return AppLocalizationsEn();
  }

  throw FlutterError(
      'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
      'an issue with the localizations generation tool. Please file an issue '
      'on GitHub with a reproducible sample app and the gen-l10n configuration '
      'that was used.');
}
