<?php
function allow_svg_upload( $mimes ) {
    $mimes['svg'] = 'image/svg+xml';
    return $mimes;
}
add_filter( 'upload_mimes', 'allow_svg_upload' );

// Fix SVG upload handling in WordPress
function fix_svg_upload_error( $data, $file, $filename, $mimes ) {
    $filetype = wp_check_filetype( $filename, $mimes );
    
    if ( $filetype['ext'] === 'svg' ) {
        $data['ext']  = 'svg';
        $data['type'] = 'image/svg+xml';
        $data['proper_filename'] = $filename;
    }

    return $data;
}
add_filter( 'wp_check_filetype_and_ext', 'fix_svg_upload_error', 10, 4 );

// Sanitize SVG files
function sanitize_svg_file( $file ) {
    if ( 'image/svg+xml' === $file['type'] ) {
        $xml = simplexml_load_file( $file['tmp_name'] );
        if ( !$xml ) {
            $file['error'] = 'Invalid SVG file uploaded.';
        }
    }
    return $file;
}
add_filter( 'wp_handle_upload_prefilter', 'sanitize_svg_file' );

// Disable default image size checks for SVG files
function disable_real_mime_check_for_svg( $data, $file, $filename, $mimes ) {
    $ext = pathinfo( $filename, PATHINFO_EXTENSION );
    if ( 'svg' === $ext ) {
        $data['ext'] = 'svg';
        $data['type'] = 'image/svg+xml';
    }
    return $data;
}
add_filter( 'wp_check_filetype_and_ext', 'disable_real_mime_check_for_svg', 10, 4 );
?>