declare module "africastalking" {
  interface SMSClient {
    send(options: { to: string[]; message: string; from?: string }): Promise<unknown>;
  }
  interface AfricasTalkingClient {
    SMS: SMSClient;
  }
  function AfricasTalking(options: { apiKey: string; username: string }): AfricasTalkingClient;
  export = AfricasTalking;
}
