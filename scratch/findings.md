# Findings from Network & Console Errors

## 1. Executive Dashboard (Login: HC_10218_2011)
### Network Failures
- **[Endpoint]**: 
- **[Status]**: 
- **[Response Body]**: 

### Console Errors/Warnings
- **[Error]**: 

## 2. Spatial Analysis Map
### Network Failures
- **[Endpoint]**: 
- **[Status]**: 
- **[Response Body]**: 

### Console Errors/Warnings
- **[Error]**: 

## 3. Case Similarity Match
### Network Failures
- **[Endpoint]**: 
- **[Status]**: 
- **[Response Body]**: 

### Console Errors/Warnings
- **[Error]**: 

## Conclusion on the Shared Cause
- **Does Dashboard use Promise.all?**: No, it uses sequential awaits. However, `MapPage.jsx` uses `Promise.all`.
- **Is the unread-count endpoint working?**: Yes, it returns 200 for HC_10218_2011 when tested outside the browser. Wait to confirm in-browser behavior.
- **Shared wrapper issue**: `apiFetch` in `client.js` throws an error whenever `response.ok` is false, and the `Authorization` header is always attached if `authToken` is present.
