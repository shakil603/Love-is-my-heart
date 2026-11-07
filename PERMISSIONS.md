# Permissions

This build declares the permission groups shown in the owner's reference
screenshots (WhatsApp, imo and Facebook Lite). They are wired to an Android
permission setup reachable from **You → Privacy & permissions → Android setup**
(and from `limh://permissions`).

| Group | Manifest permissions | Used by the demo? |
| --- | --- | --- |
| Network | `INTERNET` | Yes — loads the bundled demo or the server you choose. |
| Camera | `CAMERA` | No. Declared for a future in-app camera. |
| Microphone | `RECORD_AUDIO` | No. Declared for future voice notes. |
| Contacts | `READ_CONTACTS` | No. The demo never reads the address book. |
| Location | `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION` | No. Distance uses the city you type. |
| Phone | `READ_PHONE_STATE`, `READ_PHONE_NUMBERS`, `CALL_PHONE` | No. The demo never places calls. |
| SMS | `READ_SMS`, `SEND_SMS`, `RECEIVE_SMS` | No. The demo never reads or sends messages. |
| Call logs | `READ_CALL_LOG` | No. The demo never reads call history. |
| Calendar | `READ_CALENDAR`, `WRITE_CALENDAR` | No. No calendar feature is connected. |
| Media / storage | `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO`, `READ_MEDIA_AUDIO`, `READ_EXTERNAL_STORAGE` (≤32), `WRITE_EXTERNAL_STORAGE` (≤28) | No. The profile photo uses the system picker, which needs no storage permission. |
| Notifications | `POST_NOTIFICATIONS` (Android 13+) | No. The demo does not post notifications. |

## How it was set up

- The manifest declares every group above.
- **Android setup** opens a native dialog that explains the list and has a
  **Request all** button. It uses AndroidX `ActivityResultContracts` to request
  the runtime permissions that exist on the device's Android version. Groups
  that Android restricts (SMS and call logs) may still be refused by the system.
- **App settings** opens the system permission screen, where each toggle can be
  changed individually.
- The web demo's privacy sheet records the same audit, including which groups
  the demo actually reads (network and an on-demand photo picker only).

## Before a Play Store release

Do **not** publish this permission set as-is. Google Play requires every
sensitive permission to map to a declared core feature, and SMS/call-log access
is restricted to default handlers and a small set of approved use cases. A
dating app with no SMS, calling or contact-sync feature would be rejected.

For a store build, remove the groups without a feature, then add each one back
only with:

1. the feature that uses it,
2. a runtime rationale shown before the system prompt, and
3. the matching Play Console declaration.

The APK in `public/downloads/` is a sideloaded demo build, not a Play release.
