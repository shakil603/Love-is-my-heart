# Permissions

The APK declares exactly one permission:

| Permission | Type | Why |
| --- | --- | --- |
| `android.permission.INTERNET` | Normal | Loads the bundled offline demo, or the self-hosted server address you choose. |

There are no runtime permission prompts. The profile photo uses the Android
system picker, which returns only the image you select — no storage, media or
camera permission is needed.

## What happened to the full permission set?

Version 1.3.0 declared camera, microphone, contacts, location, phone, SMS, call
logs, calendar, media/storage and notifications. Google Play Protect blocked the
install with:

> App blocked to protect your device — This app can request access to sensitive
> data. This can increase the risk of identity theft or financial fraud.

That is the expected Play Protect behaviour for a sideloaded app that requests
SMS, call logs, contacts or phone access without a core feature. The set was
removed in 1.3.1. Declaring permissions just to mirror another app's settings
screen makes the APK uninstallable, not more capable.

## Deliberately not requested

| Permission | Reason |
| --- | --- |
| Camera | No in-app camera. The system photo picker can still use a camera app if you choose. |
| Microphone | No voice notes. |
| Contacts | No contact matching or invite flow. |
| Location | Distance uses the city you type, not GPS. |
| Phone | The app never places calls. |
| SMS | The app never reads or sends SMS. |
| Call logs | The app never reads call history. |
| Calendar | No calendar feature. |
| Media / broad storage | The system photo picker grants one selected image; the app cannot scan the gallery. |
| Notifications | No push or background notifications yet. |

The in-app **You → Privacy & permissions** sheet shows the same audit.

## If a feature needs a permission later

Add the permission **with** the feature, show a runtime rationale before the
system prompt, and complete the matching Play Console declaration. Never add a
permission only to make the Settings screen look like another app.
