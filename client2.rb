require 'socket'
require 'openssl'
require 'json'
require 'uri'
require 'base64'

class WebSocketClient
  attr_reader :url, :host, :port

  def initialize(url, headers = [])
    @url = url
    @params_header = headers
    uri = URI.parse(url)
    @host = uri.host
    @port = uri.port || (uri.scheme == 'wss' ? 443 : 80)
    @ssl = uri.scheme == 'wss'

    @socket = TCPSocket.new(@host, @port)
    @socket = setup_ssl(@socket) if @ssl

    handshake(uri)
  end

  def on_message(&block)
    @on_message = block
  end

  def on_close(&block)
    @on_close = block
  end

  def send_event(event, data)
    message = { event: event, data: data }.to_json
    send_frame(message)
  end

  def listen
    Thread.new do
      loop do
        begin
          frame = receive_frame
          @on_message.call(frame) if @on_message && frame
        rescue => e
          puts "Error: #{e.message}"
          @on_close.call if @on_close
          break
        end
      end
    end
  end

  def close
    @socket.close
    @on_close.call if @on_close
  end

  private

  def setup_ssl(socket)
    ssl_context = OpenSSL::SSL::SSLContext.new
    ssl_socket = OpenSSL::SSL::SSLSocket.new(socket, ssl_context)
    ssl_socket.sync_close = true
    ssl_socket.connect
    ssl_socket
  end

  def handshake(uri)
    path = uri.path.empty? ? '/' : uri.path
    key = Base64.encode64(Random.new.bytes(16)).strip

    headers = [
      "GET #{path} HTTP/1.1",
      "Host: #{@host}:#{@port}",
      "Upgrade: websocket",
      "Connection: Upgrade",
      "Sec-WebSocket-Key: #{key}",
      "Sec-WebSocket-Version: 13",
    ]

    @params_header.each do |header|
      headers << header
    end

    headers << "" << ""
    headers

    @socket.write(headers.join("\r\n"))
    response = @socket.readpartial(1024)
    unless response.include?("101 Switching Protocols")
      raise "Handshake failed: #{response}"
    end
  end

  def send_frame(data)
    frame = ""
    frame << 0x81.chr # FIN bit set and opcode 0x1 (text)
    length = data.bytesize
  
    if length <= 125
      frame << (0x80 | length).chr # MASK bit set
    elsif length <= 65535
      frame << 0xFE.chr
      frame << [length].pack("n")
    else
      frame << 0xFF.chr
      frame << [length >> 32, length & 0xFFFFFFFF].pack("NN")
    end
  
    mask_key = Array.new(4) { rand(0..255) }
    frame << mask_key.pack("C*")
  
    masked_data = data.bytes.each_with_index.map { |byte, i| byte ^ mask_key[i % 4] }
    frame << masked_data.pack("C*")
  
    @socket.write(frame)
  end

  def receive_frame
    first_byte = @socket.read(1).ord
    fin = (first_byte & 0x80) != 0
    opcode = first_byte & 0x0F

    second_byte = @socket.read(1).ord
    mask = (second_byte & 0x80) != 0
    length = second_byte & 0x7F

    if length == 126
      length = @socket.read(2).unpack("n").first
    elsif length == 127
      length = @socket.read(8).unpack("Q>").first
    end

    mask_key = mask ? @socket.read(4).bytes : nil
    payload = @socket.read(length).bytes

    if mask
      payload = payload.each_with_index.map { |byte, i| byte ^ mask_key[i % 4] }
    end

    payload.pack("C*")
  end
end

player_id = "134433894"
headers = 
# Utilisation
client = WebSocketClient.new("ws://localhost:8080", [
  "Player-ID: #{player_id}",
])

client.on_message do |message|
  data = JSON.parse(message)
  log = "Received event: #{data['event']}, data: #{data['data']}"
  if data['event'] == 'ping'
    puts "Received ping, sending pong"
    client.send_event('pong', {}) # Répondre avec un pong
  else
    puts "Received event: #{data['event']}, data: #{data['data']}"
  end
end

client.on_close do
  puts "Connection closed"
end

# Exemple d'envoi et d'écoute
client.listen

client.send_event("connected", "134433894")
client.send_event("greet", { name: "Ruby Client", boy: true })
#client.send_event("playerCreate", { name: "RatyGirl", player_id: "134433894", is_girl: true })
client.send_event("playerDelete", {  })

# Maintenir la connexion ouverte
sleep
