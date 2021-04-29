<?php 
/*
Plugin Name: Email Users On Posts
Plugin URI: http://www.google.com/?#q=who+is+the+dude
Description: This plugin adds a beautiful Q&A wizard to your site
Version: 0.0.1
Author: Nimrod Cohen
Text Domain: wp-wizard
Domain Path: /languages
Author URI: http://www.google.com/?#q=who+is+the+dude
License: Free for all and all purposes without warrenty and no attribution required. just use the damn thing as you please.
*/
class WPWizard {
  protected $file;
  protected $plugin;
  protected $basename;
  protected $active;

  public function __construct( $file ) {
    $this->file = $file;
    add_action( 'admin_init', [$this, 'setPluginProperties'] );
    return $this;
  }

  public function setPluginProperties() {
    $this->plugin   = get_plugin_data( $this->file );
    $this->basename = plugin_basename( $this->file );
    $this->active   = is_plugin_active( $this->basename );
  }

}

?>