if ($form_data['id'] == 1587) {
    error_log('Handling form ID 1587');
    $entryIdFormUrl = null;

    if (isset($form_data['entry_meta']['page_url'])) {
        $page_url = $form_data['entry_meta']['page_url'];
        error_log("Found page_url: " . $page_url);

        // Parse the URL and extract the 'entryId' from the query string
        $parsed_url = parse_url($page_url);
        if (isset($parsed_url['query'])) {
            parse_str($parsed_url['query'], $query_params);
            if (isset($query_params['entryId'])) {
                $entryIdFromUrl = intval($query_params['entryId']); // Extract and sanitize entryId
                error_log("Found entryId in URL: " . $entryIdFromUrl);
            } else {
                error_log("No entryId found in URL.");
            }
        } else {
            error_log("No query string found in URL.");
        }
    } else {
        error_log("No page_url found in entry_meta.");
    }

    // Prepare data for a new WPForms entry
    $new_entry_data = [
        'form_data' => $form_data, // Form structure
        'fields'    => [], // Fields and their updated values
    ];

    // Populate fields with the updated data from the submitted form
    foreach ($fields as $field) {
        if (isset($field['id']) && isset($field['value'])) {
            $new_entry_data['fields'][$field['id']] = $field['value'];
        }
    }

    // Create a new entry in WPForms
    $new_entry = wpforms()->entry->add($new_entry_data);
    if ($new_entry) {
        error_log("Successfully created new entry with ID: " . $new_entry);
    } else {
        error_log("Failed to create new entry.");
    }

    // Extract token for the API request
    $token = isset($_COOKIE['Token']) ? $_COOKIE['Token'] : 'Token not found';
    error_log("Extracted Token: " . $token);

    // Prepare the data for the API request
    $json_data = json_encode(['entry' => $entry_Id]); // Use the new entry ID
    error_log('Sending entryId: ' . $entry_Id);

    // Send the entry data to the external API
    $api_url = 'https://serverapi.talopakettiin.fi/api/forms/receive-form-data';

    $response = wp_remote_post($api_url, [
        'method'    => 'POST',
        'body'      => $json_data,
        'headers'   => [
            'Content-Type'  => 'application/json',
            'token'         => $token,
        ],
    ]);

    // Log the API response
    if (is_wp_error($response)) {
        error_log('Error: ' . $response->get_error_message());
    } else {
        error_log("Response Status Code: " . wp_remote_retrieve_response_code($response));
        error_log("Response Body: " . wp_remote_retrieve_body($response));
    }
} else {
    error_log("Form ID does not match 1587, skipping.");
}
