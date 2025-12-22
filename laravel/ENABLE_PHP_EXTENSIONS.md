# Enable PHP Extensions

To enable the `fileinfo` extension in PHP:

1. Open the PHP configuration file:
   ```
   C:\tools\php85\php.ini
   ```

2. Find the line that says:
   ```
   ;extension=fileinfo
   ```

3. Remove the semicolon (;) to uncomment it:
   ```
   extension=fileinfo
   ```

4. Save the file

5. Verify it's enabled by running:
   ```powershell
   php -m | findstr fileinfo
   ```

Alternatively, you can run composer with the ignore flag:
```powershell
composer install --ignore-platform-req=ext-fileinfo
```

But it's better to enable the extension properly.

