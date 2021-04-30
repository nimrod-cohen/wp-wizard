<?php

class WPWizardUpdater {
  protected $file;
  protected $plugin;
  protected $basename;
  protected $active;
  private $repository;
  private $username;
  private $authorizeToken; 
  private $githubResponse;

  public function __construct( $file ) {
    $this->file = $file;
    add_action( 'admin_init', [$this, 'setPluginProperties'] );
    return $this;
  }

  public function initialize() {
    add_filter( 'pre_set_site_transient_update_plugins', [$this, 'modifyTransient'], 10, 1 );
    add_filter( 'plugins_api', [$this, 'pluginPopup'], 10, 3);
    add_filter( 'upgrader_post_install', [$this, 'afterInstall'], 10, 3 );
  }

  public function setPluginProperties() {
    $this->plugin   = get_plugin_data( $this->file );
    $this->basename = plugin_basename( $this->file );
    $this->active   = is_plugin_active( $this->basename );
  }

  public function setUsername( $username ) {
    $this->username = $username;
  }

  public function setAuthorizeToken( $token ) {
    $this->authorizeToken = $token;
  }

  public function setRepository( $repository ) {
    $this->repository = $repository;
  }

  private function getRepositoryInfo() {
    if ( is_null( $this->githubResponse ) ) { // Do we have a response?
      $requestUri = sprintf( 'https://api.github.com/repos/%s/%s/releases', $this->username, $this->repository ); // Build URI
      if( $this->authorizeToken ) { // Is there an access token?
          $requestUri = add_query_arg( 'access_token', $this->authorizeToken, $requestUri ); // Append it
      }

      $response = json_decode( wp_remote_retrieve_body( wp_remote_get( $requestUri ) ), true ); // Get JSON and parse it

      if( is_array( $response ) ) { // If it is an array
          $response = current( $response ); // Get the first item
      }

      if( $this->authorizeToken ) { // Is there an access token?
          $response['zipball_url'] = add_query_arg( 'access_token', $this->authorizeToken, $response['zipball_url'] ); // Update our zip url with token
      }
      $this->githubResponse = $response; // Set it to our property  
    }
  }

  public function modifyTransient( $transient ) {

    if( property_exists( $transient, 'checked') ) { // Check if transient has a checked property
      if( $checked = $transient->checked ) { // Did WordPress check for updates?
        $this->getRepositoryInfo(); // Get the repo info
        $outdated = version_compare( $this->githubResponse['tag_name'], $checked[$this->basename], 'gt' ); // Check if we're out of date
        if( $outdated ) {
          $newFiles = $this->githubResponse['zipball_url']; // Get the ZIP
          $slug = current( explode('/', $this->basename ) ); // Create valid slug
          $plugin = [ // setup our plugin info
            'url' => $this->plugin["PluginURI"],
            'slug' => $slug,
            'package' => $newFiles,
            'new_version' => $this->githubResponse['tag_name']
          ];
          $transient->response[ $this->basename ] = (object) $plugin; // Return it in response
        }
      }
    }
    return $transient; // Return filtered transient
  }

  public function pluginPopup( $result, $action, $args ) {
    if( ! empty( $args->slug ) ) { // If there is a slug
      if( $args->slug == current( explode( '/' , $this->basename ) ) ) { // And it's our slug
        $this->getRepositoryInfo(); // Get our repo info
        // Set it to an array
        $plugin = [
          'name'              => $this->plugin["Name"],
          'slug'              => $this->basename,
          'version'           => $this->githubResponse['tag_name'],
          'author'            => $this->plugin["AuthorName"],
          'author_profile'    => $this->plugin["AuthorURI"],
          'last_updated'      => $this->githubResponse['published_at'],
          'homepage'          => $this->plugin["PluginURI"],
          'short_description' => $this->plugin["Description"],
          'sections'          => [
            'Description'   => $this->plugin["Description"],
            'Updates'       => $this->githubResponse['body'],
          ],
          'download_link'     => $this->githubResponse['zipball_url']
        ];
        return (object) $plugin; // Return the data
      }
    }   
    return $result; // Otherwise return default
  }

  public function afterInstall( $response, $hook_extra, $result ) {
    global $wp_filesystem; // Get global FS object
  
    $install_directory = plugin_dir_path( $this->file ); // Our plugin directory 
    $wp_filesystem->move( $result['destination'], $install_directory ); // Move files to the plugin dir
    $result['destination'] = $install_directory; // Set the destination for the rest of the stack
  
    if ( $this->active ) { // If it was active
      activate_plugin( $this->basename ); // Reactivate
    }
    return $result;
  }
}

?>