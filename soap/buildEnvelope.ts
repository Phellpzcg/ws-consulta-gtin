export function buildSoapEnvelope(gtin14: string): string {
  // SOAP 1.2 usa application/soap+xml e namespace soap12
  // O conteúdo exato do body segue o padrão do WS "ccgConsGTIN"
  // Você pode ajustar os namespaces conforme a NT se necessário.
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <ccgConsGTIN xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/ccgConsGTIN">
      <nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe">
        <![CDATA[
<consGTIN xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">
  <GTIN>${gtin14}</GTIN>
</consGTIN>
        ]]>
      </nfeDadosMsg>
    </ccgConsGTIN>
  </soap12:Body>
</soap12:Envelope>`;
}

