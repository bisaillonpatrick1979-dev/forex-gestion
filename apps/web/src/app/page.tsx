export default function AccueilPage() {
  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        📈 Forex Gestion
      </h1>
      <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
        Système de trading automatisé avec 3 agents IA spécialisés
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
        <CarteStatut
          titre="Analyste Technique"
          description="Analyse les graphiques et génère des signaux directionnels"
          endpoint="/api/agents/analyser"
        />
        <CarteStatut
          titre="Gestionnaire des Risques"
          description="Calcule le sizing de position et les niveaux de risque"
          endpoint="/api/agents/risque"
        />
        <CarteStatut
          titre="Exécuteur"
          description="Prend la décision finale d'exécuter ou non"
          endpoint="/api/agents/executer"
        />
      </div>

      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Endpoints API</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              <th style={{ textAlign: 'left', padding: '0.5rem', color: '#94a3b8' }}>Méthode</th>
              <th style={{ textAlign: 'left', padding: '0.5rem', color: '#94a3b8' }}>Endpoint</th>
              <th style={{ textAlign: 'left', padding: '0.5rem', color: '#94a3b8' }}>Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['GET', '/api/health', 'Statut du système'],
              ['POST', '/api/agents/pipeline', 'Pipeline complet 3-agents'],
              ['POST', '/api/agents/analyser', 'Analyse technique seule'],
              ['GET', '/api/oanda/compte', 'Infos compte OANDA'],
              ['GET', '/api/oanda/bougies/:paire', 'Historique bougies'],
            ].map(([methode, endpoint, desc]) => (
              <tr key={endpoint} style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '0.5rem' }}>
                  <span style={{
                    background: methode === 'GET' ? '#164e63' : '#1e3a5f',
                    color: methode === 'GET' ? '#67e8f9' : '#93c5fd',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}>{methode}</span>
                </td>
                <td style={{ padding: '0.5rem', fontFamily: 'monospace', color: '#a5b4fc' }}>{endpoint}</td>
                <td style={{ padding: '0.5rem', color: '#94a3b8' }}>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

function CarteStatut({
  titre,
  description,
  endpoint,
}: {
  titre: string;
  description: string;
  endpoint: string;
}) {
  return (
    <div style={{
      background: '#1e293b',
      borderRadius: 8,
      padding: '1.25rem',
      border: '1px solid #334155',
    }}>
      <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 600 }}>{titre}</h3>
      <p style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', color: '#94a3b8' }}>{description}</p>
      <code style={{ fontSize: '0.75rem', color: '#a5b4fc', background: '#0f172a', padding: '2px 6px', borderRadius: 4 }}>
        {endpoint}
      </code>
    </div>
  );
}
