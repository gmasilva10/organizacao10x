"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FEATURES, FeatureKey } from '@/lib/features'
import { Construction, ExternalLink, Github } from 'lucide-react'

interface FeaturePlaceholderProps {
  feature: FeatureKey
  title: string
  description: string
  icon?: React.ReactNode
  estimatedDate?: string
  githubIssue?: string
  demoUrl?: string
  className?: string
}

export function FeaturePlaceholder({
  feature,
  title,
  description,
  icon = <Construction className="h-8 w-8" />,
  estimatedDate,
  githubIssue,
  demoUrl,
  className = ""
}: FeaturePlaceholderProps) {
  const [isEnabled, setIsEnabled] = useState(FEATURES[feature])

  const handleEnable = () => {
    // Em desenvolvimento - simular ativação
    setIsEnabled(true)
    console.log(`Feature ${feature} ativada`)
  }

  const handleGithubClick = () => {
    if (githubIssue) {
      window.open(`https://github.com/organizacao10x/organizacao10x/issues/${githubIssue}`, '_blank')
    }
  }

  const handleDemoClick = () => {
    if (demoUrl) {
      window.open(demoUrl, '_blank')
    }
  }

  if (isEnabled) {
    return (
      <Card className={`border-green-200 bg-green-50 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-700 mb-4">{description}</p>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-green-600 border-green-300">
              Ativo
            </Badge>
            {githubIssue && (
              <Button variant="outline" size="sm" onClick={handleGithubClick}>
                <Github className="h-4 w-4 mr-1" />
                Issue #{githubIssue}
              </Button>
            )}
            {demoUrl && (
              <Button variant="outline" size="sm" onClick={handleDemoClick}>
                <ExternalLink className="h-4 w-4 mr-1" />
                Demo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`border-orange-200 bg-orange-50 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-orange-700 mb-4">{description}</p>
        
        {estimatedDate && (
          <p className="text-sm text-orange-600 mb-4">
            <strong>Previsão:</strong> {estimatedDate}
          </p>
        )}
        
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleEnable} size="sm">
            Ativar Feature Flag
          </Button>
          
          {githubIssue && (
            <Button variant="outline" size="sm" onClick={handleGithubClick}>
              <Github className="h-4 w-4 mr-1" />
              Issue #{githubIssue}
            </Button>
          )}
          
          {demoUrl && (
            <Button variant="outline" size="sm" onClick={handleDemoClick}>
              <ExternalLink className="h-4 w-4 mr-1" />
              Demo
            </Button>
          )}
          
          <Badge variant="outline" className="text-orange-600 border-orange-300">
            Em Desenvolvimento
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
