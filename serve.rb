# Petit serveur local pour prévisualiser le site (ruby serve.rb) — non utilisé en ligne
require 'webrick'
mime = WEBrick::HTTPUtils::DefaultMimeTypes.merge(
  'webp' => 'image/webp', 'woff2' => 'font/woff2', 'mp4' => 'video/mp4', 'svg' => 'image/svg+xml', 'js' => 'text/javascript'
)
# Pas de cache pendant qu'on travaille : chaque rechargement récupère la dernière version
sans_cache = proc do |req, res|
  req.header.delete('if-none-match')
  req.header.delete('if-modified-since')
end
serveur = WEBrick::HTTPServer.new(Port: 8080, DocumentRoot: __dir__, MimeTypes: mime,
  RequestCallback: sans_cache, Logger: WEBrick::Log.new($stderr, WEBrick::Log::WARN), AccessLog: [])
serveur.mount_proc('/favicon.ico') { |_, res| res.status = 204 }
class << serveur
  def service(req, res)
    super
    res['Cache-Control'] = 'no-store'
  end
end
trap('INT') { serveur.shutdown }
serveur.start
