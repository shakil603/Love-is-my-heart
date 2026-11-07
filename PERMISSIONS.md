# Permissions

The Android app declares **one** permission:

| Permission | Type | Why |
| --- | --- | --- |
| `android.permission.INTERNET` | Normal | Loads the offline demo from the APK, or the self-hosted server address you choose. |

That is the whole list. There are no runtime permission prompts because there is
no feature that needs one.

## What is deliberately not requested

| Permission | Status | Reason |
| --- | --- | --- |
| Camera | Not requested | There is no in-app camera. If you pick a photo, the system picker can use a camera app and returns only the image you choose. |
| Contacts | Not requested | There is no contact matching or invite flow. |
| Location | Not requested | Distance is calculated from the city you type, not from GPS. |
| Microphone | Not requested | Voice notes are not implemented. |
| Phone | Not requested | The app never places calls. |
| SMS | Not requested | The app never reads or sends SMS. |
| Call logs | Not requested | The app never reads call history. |
| Calendar | Not requested | There is no calendar feature. |
| Storage / photos | Not requested | Profile photos use the Android photo picker. The picker returns one URI that you selected; the app cannot browse or scan the rest of your gallery. |
| Notifications | Not requested | The demo has no push or background notifications. |

## Why not copy the permission screens from WhatsApp, imo or Facebook Lite?

Those apps have calls, SMS, contact sync, location features and media libraries.
This app does not. Declaring permissions that no feature uses would:

- make Android Settings show scary toggles the app never needs;
- create a larger attack surface if the WebView or a dependency is compromised;
- risk a Google Play policy rejection, because sensitive permissions must be
  tied to a documented core feature; and
- train users to grant access without understanding why.

If a feature is added later, add its permission **with** the feature, a runtime
rationale, and a privacy note in the app. The in-app **You → Privacy &
permissions** sheet lists the current audit.

## Photo picker

The edit-profile sheet opens the system picker through the WebView file chooser.
No `READ_MEDIA_IMAGES`, `READ_EXTERNAL_STORAGE` or `CAMERA` permission is needed:
the picker is a separate system component, and the app receives only the chosen
image. The image is resized to 512 px and stored as a data URL in the local demo
state on the phone.
